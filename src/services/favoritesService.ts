import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../firebase';
import { YouTubeSearchResultItem } from '../types/youtube';

const FAVORITES_COLLECTION = 'favorites';

// 중복 호출 방지를 위한 처리 중인 videoId 세트
const processingFavoriteIds = new Set<string>();

export async function addFavorite(video: YouTubeSearchResultItem) {
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
      createdAt: Date.now(),
    });
    
    console.log(`addFavorite 완료: ${video.snippet?.title}`);
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
  return deleteDoc(doc(db, FAVORITES_COLLECTION, favoriteId));
}

export async function getFavorites() {
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
  
  return sortedDocs.map((doc) => ({ id: doc.id, ...doc.data() }));
}
