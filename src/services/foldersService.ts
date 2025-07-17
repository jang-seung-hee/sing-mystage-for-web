import { db } from '../firebase';
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  updateDoc,
} from 'firebase/firestore';
import { auth } from '../firebase';
import { moveFavoritesToDefaultFolder, addFavorite } from './favoritesService';
import { SharedFolder, downloadSharedFolder } from './sharedFavoritesService';

const FOLDERS_COLLECTION = 'favorite_folders';

export interface FolderItem {
  id: string;
  name: string;
  count: number;
  uid: string;
  createdAt: number;
  updatedAt: number;
  isFromOnline?: boolean; // 온라인에서 가져온 폴더인지 표시
}

// 중복 호출 방지를 위한 처리 중인 folderName 세트
const processingFolderNames = new Set<string>();

export async function addFolder(name: string, isFromOnline: boolean = false): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  const trimmedName = name.trim();
  if (!trimmedName) throw new Error('폴더명을 입력해주세요');

  const processKey = `${user.uid}_${trimmedName}`;

  // 이미 처리 중인 경우 중복 호출 방지
  if (processingFolderNames.has(processKey)) {
    throw new Error('이미 처리 중인 폴더입니다');
  }

  try {
    // 처리 중 플래그 설정
    processingFolderNames.add(processKey);

    // 중복 폴더명 체크
    const q = query(
      collection(db, FOLDERS_COLLECTION),
      where('uid', '==', user.uid),
      where('name', '==', trimmedName),
    );
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('이미 같은 이름의 폴더가 존재합니다');
    }

    // 새 폴더 추가
    const folderData: any = {
      uid: user.uid,
      name: trimmedName,
      count: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // 온라인에서 가져온 폴더인 경우 플래그 추가
    if (isFromOnline) {
      folderData.isFromOnline = true;
    }

    const result = await addDoc(collection(db, FOLDERS_COLLECTION), folderData);

    console.log(`addFolder 완료: ${trimmedName}`);
    return result.id;
  } catch (error) {
    console.error('addFolder 에러:', error);
    throw error;
  } finally {
    // 처리 완료 후 플래그 제거
    processingFolderNames.delete(processKey);
  }
}

export async function updateFolder(folderId: string, newName: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  const trimmedName = newName.trim();
  if (!trimmedName) throw new Error('폴더명을 입력해주세요');

  try {
    // 중복 폴더명 체크 (자신 제외)
    const q = query(
      collection(db, FOLDERS_COLLECTION),
      where('uid', '==', user.uid),
      where('name', '==', trimmedName),
    );
    const snapshot = await getDocs(q);

    // 자신이 아닌 다른 폴더에서 같은 이름이 있는지 확인
    const duplicateDoc = snapshot.docs.find((docSnap) => docSnap.id !== folderId);
    if (duplicateDoc) {
      throw new Error('이미 같은 이름의 폴더가 존재합니다');
    }

    // 폴더 업데이트
    const folderRef = doc(db, FOLDERS_COLLECTION, folderId);
    await updateDoc(folderRef, {
      name: trimmedName,
      updatedAt: Date.now(),
    });

    console.log(`updateFolder 완료: ${trimmedName}`);
  } catch (error) {
    console.error('updateFolder 에러:', error);
    throw error;
  }
}

export async function deleteFolder(folderId: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    // 1. 해당 폴더의 즐겨찾기들을 '기본 폴더'로 이동
    await moveFavoritesToDefaultFolder(folderId);

    // 2. 폴더 삭제
    await deleteDoc(doc(db, FOLDERS_COLLECTION, folderId));

    console.log(`deleteFolder 완료: ${folderId}`);
  } catch (error) {
    console.error('deleteFolder 에러:', error);
    throw error;
  }
}

export async function getFolders(): Promise<FolderItem[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    const q = query(collection(db, FOLDERS_COLLECTION), where('uid', '==', user.uid));
    const snapshot = await getDocs(q);

    // 클라이언트에서 정렬 (createdAt 기준 오름차순)
    const sortedDocs = snapshot.docs.sort((a, b) => {
      const aData = a.data();
      const bData = b.data();
      return (aData.createdAt || 0) - (bData.createdAt || 0);
    });

    const folders = sortedDocs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as FolderItem,
    );

    // 기본 폴더가 없으면 자동 생성
    const hasDefaultFolder = folders.some((folder) => folder.name === '기본 폴더');
    if (!hasDefaultFolder) {
      const defaultFolderId = await addFolder('기본 폴더');
      folders.unshift({
        id: defaultFolderId,
        name: '기본 폴더',
        count: 0,
        uid: user.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    // 즐겨찾기 데이터를 가져와서 실시간 카운트 계산
    const favoritesQuery = query(collection(db, 'favorites'), where('uid', '==', user.uid));
    const favoritesSnapshot = await getDocs(favoritesQuery);

    // 폴더별 즐겨찾기 개수 계산
    const folderCounts: Record<string, number> = {};

    favoritesSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const folderId = data.folderId;

      if (!folderId) {
        // folderId가 null이면 기본 폴더에 속함
        const defaultFolder = folders.find((f) => f.name === '기본 폴더');
        if (defaultFolder) {
          folderCounts[defaultFolder.id] = (folderCounts[defaultFolder.id] || 0) + 1;
        }
      } else {
        // 특정 폴더에 속함
        folderCounts[folderId] = (folderCounts[folderId] || 0) + 1;
      }
    });

    // 각 폴더에 실시간 카운트 적용
    const foldersWithCounts = folders.map((folder) => ({
      ...folder,
      count: folderCounts[folder.id] || 0,
    }));

    return foldersWithCounts;
  } catch (error) {
    console.error('getFolders 에러:', error);
    throw error;
  }
}

// 온라인 공유 폴더를 내 폴더로 가져오기
export async function importOnlineFolder(sharedFolder: SharedFolder): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  try {
    // 다운로드 카운트 증가 (공유 폴더 기준)
    try {
      await downloadSharedFolder(sharedFolder.id);
    } catch (err) {
      console.warn('다운로드 카운트 증가 실패:', err);
    }
    // 1. 새 폴더 생성 (온라인 플래그와 함께)
    const folderId = await addFolder(sharedFolder.title, true);

    // 2. 공유 폴더의 모든 즐겨찾기를 새 폴더에 추가
    let successCount = 0;
    for (const favorite of sharedFolder.favorites) {
      try {
        await addFavorite(favorite.video, folderId);
        successCount++;
      } catch (error) {
        console.error('즐겨찾기 추가 실패:', favorite.video.snippet?.title, error);
      }
    }

    console.log(
      `온라인 폴더 가져오기 완료: ${sharedFolder.title} (${successCount}/${sharedFolder.favorites.length}개 항목)`,
    );

    return folderId;
  } catch (error) {
    console.error('온라인 폴더 가져오기 실패:', error);
    throw error;
  }
}
