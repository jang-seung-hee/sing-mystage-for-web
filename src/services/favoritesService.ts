import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where, updateDoc } from 'firebase/firestore';
import { auth } from '../firebase';
import { YouTubeSearchResultItem, FavoriteItem } from '../types/youtube';

const FAVORITES_COLLECTION = 'favorites';

// 중복 호출 방지를 위한 처리 중인 videoId 세트
const processingFavoriteIds = new Set<string>();

export async function addFavorite(video: YouTubeSearchResultItem, folderId?: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  // videoId 정규화 및 중복 호출 방지
  const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
  if (!videoId) {
    console.warn('addFavorite: videoId가 없습니다.', video);
    return;
  }
  
  const processKey = `${user.uid}_${videoId}`;
  
  // 이미 처리 중인 경우 중복 호출 방지
  if (processingFavoriteIds.has(processKey)) {
    console.log(`addFavorite: 이미 처리 중인 비디오입니다. videoId: ${videoId}`);
    return;
  }
  
  try {
    // 처리 중 플래그 설정
    processingFavoriteIds.add(processKey);
    
    // 중복 방지: 이미 있는 경우 삭제 후 추가 (클라이언트 필터링으로 인덱스 불필요)
  const q = query(
    collection(db, FAVORITES_COLLECTION),
    where('uid', '==', user.uid)
  );
  const snapshot = await getDocs(q);
  
  // 클라이언트에서 중복 비디오 찾기
  const duplicateDocs = snapshot.docs.filter(docSnap => {
    const data = docSnap.data();
    const existingVideoId = typeof data.video?.id === 'string' 
      ? data.video.id 
      : data.video?.id?.videoId;
    return existingVideoId === videoId;
  });
  
    for (const docSnap of duplicateDocs) {
      await deleteDoc(doc(db, FAVORITES_COLLECTION, docSnap.id));
    }
    
    const result = await addDoc(collection(db, FAVORITES_COLLECTION), {
      uid: user.uid,
      video,
      folderId: folderId || null, // 폴더 ID 저장 (없으면 null로 기본 폴더 처리)
      createdAt: Date.now(),
    });
    
    console.log(`addFavorite 완료: ${video.snippet?.title} (폴더: ${folderId || '기본'})`);
    return result;
  } catch (error) {
    console.error('addFavorite 에러:', error);
    throw error;
  } finally {
    // 처리 완료 후 플래그 제거
    processingFavoriteIds.delete(processKey);
  }
}

export async function removeFavorite(favoriteId: string) {
  try {
    await deleteDoc(doc(db, FAVORITES_COLLECTION, favoriteId));
    return;
  } catch (error) {
    console.error('removeFavorite 에러:', error);
    throw error;
  }
}

export async function getFavorites(): Promise<FavoriteItem[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  const q = query(
    collection(db, FAVORITES_COLLECTION), 
    where('uid', '==', user.uid),
  );
  const snapshot = await getDocs(q);
  
  // 클라이언트에서 정렬 (createdAt 기준 내림차순)
  const sortedDocs = snapshot.docs.sort((a, b) => {
    const aData = a.data();
    const bData = b.data();
    return (bData.createdAt || 0) - (aData.createdAt || 0);
  });
  
  return sortedDocs.map((doc) => ({ 
    id: doc.id, 
    ...doc.data() 
  } as FavoriteItem));
}

// 폴더별 즐겨찾기 조회
export async function getFavoritesByFolder(folderId?: string): Promise<FavoriteItem[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  const q = query(
    collection(db, FAVORITES_COLLECTION), 
    where('uid', '==', user.uid),
  );
  const snapshot = await getDocs(q);
  
  // 클라이언트에서 폴더별 필터링 및 정렬
  const filteredDocs = snapshot.docs.filter(doc => {
    const data = doc.data();
    // folderId가 null이거나 undefined인 경우 기본 폴더로 처리
    if (!folderId) {
      return !data.folderId; // 기본 폴더 (folderId가 없는 항목들)
    }
    return data.folderId === folderId;
  }).sort((a, b) => {
    const aData = a.data();
    const bData = b.data();
    return (bData.createdAt || 0) - (aData.createdAt || 0);
  });
  
  return filteredDocs.map((doc) => ({ 
    id: doc.id, 
    ...doc.data() 
  } as FavoriteItem));
}

// 즐겨찾기를 다른 폴더로 이동
export async function moveFavoriteToFolder(favoriteId: string, folderId?: string) {
  const favoriteRef = doc(db, FAVORITES_COLLECTION, favoriteId);
  await updateDoc(favoriteRef, {
    folderId: folderId || null
  });
}

// 폴더 삭제시 해당 폴더의 즐겨찾기들을 기본 폴더로 이동
export async function moveFavoritesToDefaultFolder(deletedFolderId: string) {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  const q = query(
    collection(db, FAVORITES_COLLECTION), 
    where('uid', '==', user.uid),
  );
  const snapshot = await getDocs(q);
  
  // 삭제될 폴더의 즐겨찾기들을 찾아서 기본 폴더로 이동
  const movePromises = snapshot.docs
    .filter(doc => doc.data().folderId === deletedFolderId)
    .map(doc => 
      updateDoc(doc.ref, { folderId: null })
    );
  
  if (movePromises.length > 0) {
    await Promise.all(movePromises);
    console.log(`${movePromises.length}개의 즐겨찾기를 기본 폴더로 이동했습니다.`);
  }
}

// 바로 장착 기능: 폴더의 즐겨찾기들을 재생목록용으로 가져오기
export async function getFavoritesForPlaylist(folderId?: string): Promise<FavoriteItem[]> {
  const favorites = await getFavoritesByFolder(folderId);
  
  // 재생목록에 적합한 형태로 변환하여 반환
  return favorites.map(favorite => ({
    ...favorite,
    // 추가 메타데이터가 필요한 경우 여기서 처리
  }));
}

// 폴더 공유를 위한 폴더 정보와 즐겨찾기 번들
export async function getFolderBundle(folderId?: string): Promise<{
  folderInfo: { id: string; name: string } | null;
  favorites: FavoriteItem[];
}> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  // 폴더 정보 가져오기
  let folderInfo = null;
  if (folderId) {
    // 사용자 생성 폴더의 경우 폴더 정보 조회
    const folderQuery = query(
      collection(db, 'favorite_folders'),
      where('uid', '==', user.uid)
    );
    const folderSnapshot = await getDocs(folderQuery);
    const folder = folderSnapshot.docs.find(doc => doc.id === folderId);
    
    if (folder) {
      folderInfo = {
        id: folder.id,
        name: folder.data().name
      };
    }
  } else {
    // 기본 폴더
    folderInfo = {
      id: 'default',
      name: '기본 폴더'
    };
  }

  // 즐겨찾기 목록 가져오기
  const favorites = await getFavoritesByFolder(folderId);

  return {
    folderInfo,
    favorites
  };
}
