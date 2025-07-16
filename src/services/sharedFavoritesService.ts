import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, increment, doc, limit } from 'firebase/firestore';
import { auth } from '../firebase';
import { FavoriteItem } from '../types/youtube';

const SHARED_FAVORITES_COLLECTION = 'shared_favorites';

// 공유된 폴더 인터페이스
export interface SharedFolder {
  id: string;
  title: string;
  description: string;
  tags: string[];
  authorId: string;
  authorName: string;
  favoriteCount: number;
  downloadCount: number;
  rating: number;
  ratingCount: number;
  favorites: FavoriteItem[];
  createdAt: number;
  updatedAt: number;
}

// 공유 폴더 업로드
export async function shareFolder(
  title: string,
  description: string,
  tags: string[],
  favorites: FavoriteItem[]
): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  if (!title.trim()) throw new Error('폴더 제목을 입력해주세요');
  if (favorites.length === 0) throw new Error('공유할 즐겨찾기가 없습니다');
  
  try {
    const sharedFolder: Omit<SharedFolder, 'id'> = {
      title: title.trim(),
      description: description.trim(),
      tags: tags.map(tag => tag.trim().toLowerCase()).filter(tag => tag.length > 0),
      authorId: user.uid,
      authorName: user.displayName || user.email || '익명',
      favoriteCount: favorites.length,
      downloadCount: 0,
      rating: 0,
      ratingCount: 0,
      favorites: favorites.map(fav => {
        const { folderId, ...favWithoutFolderId } = fav;
        return {
          ...favWithoutFolderId,
          // 공유시 개인 정보 제거
          uid: '', // 원본 사용자 ID 제거
          // folderId는 완전히 제거 (undefined 대신)
        };
      }),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    const result = await addDoc(collection(db, SHARED_FAVORITES_COLLECTION), sharedFolder);
    console.log(`폴더 공유 완료: ${title} (${favorites.length}개 항목)`);
    return result.id;
  } catch (error) {
    console.error('폴더 공유 에러:', error);
    throw error;
  }
}

// 공유된 폴더 검색
export async function searchSharedFolders(
  searchQuery?: string,
  sortBy: 'latest' | 'popular' | 'rating' = 'latest',
  pageLimit: number = 20
): Promise<SharedFolder[]> {
  try {
    let q = query(collection(db, SHARED_FAVORITES_COLLECTION));
    
    // 정렬 조건 추가
    switch (sortBy) {
      case 'latest':
        q = query(q, orderBy('createdAt', 'desc'));
        break;
      case 'popular':
        q = query(q, orderBy('downloadCount', 'desc'));
        break;
      case 'rating':
        q = query(q, orderBy('rating', 'desc'));
        break;
    }
    
    // 결과 수 제한
    q = query(q, limit(pageLimit));
    
    const snapshot = await getDocs(q);
    let results = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SharedFolder));
    
    // 클라이언트 사이드에서 검색 필터링 (Firestore 텍스트 검색 제한 우회)
    if (searchQuery && searchQuery.trim()) {
      const searchTerm = searchQuery.trim().toLowerCase();
      results = results.filter(folder => 
        folder.title.toLowerCase().includes(searchTerm) ||
        folder.description.toLowerCase().includes(searchTerm) ||
        folder.tags.some(tag => tag.includes(searchTerm)) ||
        folder.authorName.toLowerCase().includes(searchTerm)
      );
    }
    
    return results;
  } catch (error) {
    console.error('공유 폴더 검색 에러:', error);
    throw error;
  }
}

// 공유 폴더 다운로드 (가져오기)
export async function downloadSharedFolder(sharedFolderId: string): Promise<SharedFolder> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  try {
    // 다운로드 카운트 증가
    const folderRef = doc(db, SHARED_FAVORITES_COLLECTION, sharedFolderId);
    await updateDoc(folderRef, {
      downloadCount: increment(1)
    });
    
    // 업데이트된 폴더 정보 가져오기
    const snapshot = await getDocs(query(
      collection(db, SHARED_FAVORITES_COLLECTION),
      where('__name__', '==', sharedFolderId)
    ));
    
    if (snapshot.empty) {
      throw new Error('공유 폴더를 찾을 수 없습니다');
    }
    
    const folderData = snapshot.docs[0].data() as Omit<SharedFolder, 'id'>;
    return {
      id: sharedFolderId,
      ...folderData
    };
  } catch (error) {
    console.error('공유 폴더 다운로드 에러:', error);
    throw error;
  }
}

// 공유 폴더 평점 주기
export async function rateSharedFolder(sharedFolderId: string, rating: number): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  if (rating < 1 || rating > 5) throw new Error('평점은 1-5 사이여야 합니다');
  
  try {
    // TODO: 실제로는 사용자별 평점 기록을 별도 컬렉션에 저장하여 중복 방지
    // 현재는 단순 평균 계산으로 구현
    const folderRef = doc(db, SHARED_FAVORITES_COLLECTION, sharedFolderId);
    await updateDoc(folderRef, {
      rating: increment(rating),
      ratingCount: increment(1)
    });
    
    console.log(`평점 추가: ${rating}점`);
  } catch (error) {
    console.error('평점 추가 에러:', error);
    throw error;
  }
}

// 내가 공유한 폴더 목록
export async function getMySharedFolders(): Promise<SharedFolder[]> {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');
  
  try {
    const q = query(
      collection(db, SHARED_FAVORITES_COLLECTION),
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as SharedFolder));
  } catch (error) {
    console.error('내 공유 폴더 조회 에러:', error);
    throw error;
  }
}

// 인기 태그 목록 가져오기
export async function getPopularTags(limit: number = 20): Promise<string[]> {
  try {
    const snapshot = await getDocs(collection(db, SHARED_FAVORITES_COLLECTION));
    const tagCounts: Record<string, number> = {};
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.tags && Array.isArray(data.tags)) {
        data.tags.forEach((tag: string) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // 빈도순으로 정렬하여 상위 태그 반환
    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([tag]) => tag);
  } catch (error) {
    console.error('인기 태그 조회 에러:', error);
    return [];
  }
} 