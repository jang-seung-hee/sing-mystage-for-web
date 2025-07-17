import { db } from '../firebase';
import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { auth } from '../firebase';
import { YouTubeSearchResultItem } from '../types/youtube';

const RECENT_COLLECTION = 'recent_played';
const MAX_RECENTS = 20;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000; // 3일 = 3 * 24 * 60 * 60 * 1000 ms

// 중복 호출 방지를 위한 처리 중인 videoId 세트
const processingVideoIds = new Set<string>();

// 3일 이전 데이터 자동 삭제 함수 (클라이언트 필터링으로 인덱스 불필요)
async function cleanupOldRecents(uid: string) {
  const cutoffTime = Date.now() - THREE_DAYS_MS;

  // 단순 쿼리로 사용자의 모든 데이터 가져오기
  const q = query(collection(db, RECENT_COLLECTION), where('uid', '==', uid));

  const snapshot = await getDocs(q);

  // 클라이언트에서 필터링하여 삭제 대상 찾기
  const oldDocs = snapshot.docs.filter((docSnap) => {
    const data = docSnap.data();
    return (data.playedAt || 0) < cutoffTime;
  });

  const deletePromises = oldDocs.map((docSnap) =>
    deleteDoc(doc(db, RECENT_COLLECTION, docSnap.id)),
  );

  await Promise.all(deletePromises);

  if (oldDocs.length > 0) {
    console.log(`자동 삭제된 오래된 재생 기록: ${oldDocs.length}개`);
  }
}

export async function addRecent(video: YouTubeSearchResultItem) {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  // videoId 정규화 및 중복 호출 방지
  const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
  if (!videoId) {
    console.warn('addRecent: videoId가 없습니다.', video);
    return;
  }

  const processKey = `${user.uid}_${videoId}`;

  // 이미 처리 중인 경우 중복 호출 방지
  if (processingVideoIds.has(processKey)) {
    console.log(`addRecent: 이미 처리 중인 비디오입니다. videoId: ${videoId}`);
    return;
  }

  try {
    // 처리 중 플래그 설정
    processingVideoIds.add(processKey);

    // 3일 이전 데이터 자동 삭제
    await cleanupOldRecents(user.uid);

    // 중복 방지: 이미 있는 경우 삭제 후 추가 (클라이언트 필터링으로 인덱스 불필요)
    const q = query(collection(db, RECENT_COLLECTION), where('uid', '==', user.uid));
    const snapshot = await getDocs(q);

    // 클라이언트에서 중복 비디오 찾기
    const duplicateDocs = snapshot.docs.filter((docSnap) => {
      const data = docSnap.data();
      const existingVideoId =
        typeof data.video?.id === 'string' ? data.video.id : data.video?.id?.videoId;
      return existingVideoId === videoId;
    });

    for (const docSnap of duplicateDocs) {
      await deleteDoc(doc(db, RECENT_COLLECTION, docSnap.id));
    }

    // 새 항목 추가
    await addDoc(collection(db, RECENT_COLLECTION), {
      uid: user.uid,
      video,
      playedAt: Date.now(),
      createdAt: Date.now(),
    });

    // 최근 20개만 유지
    const allQ = query(collection(db, RECENT_COLLECTION), where('uid', '==', user.uid));
    const allSnap = await getDocs(allQ);
    // 클라이언트에서 정렬 (playedAt 기준 내림차순)
    const docs = allSnap.docs.sort((a, b) => {
      const aData = a.data();
      const bData = b.data();
      return (bData.playedAt || 0) - (aData.playedAt || 0);
    });
    if (docs.length > MAX_RECENTS) {
      for (let i = MAX_RECENTS; i < docs.length; i++) {
        await deleteDoc(doc(db, RECENT_COLLECTION, docs[i].id));
      }
    }

    console.log(`addRecent 완료: ${video.snippet?.title}`);
  } catch (error) {
    console.error('addRecent 에러:', error);
    throw error;
  } finally {
    // 처리 완료 후 플래그 제거
    processingVideoIds.delete(processKey);
  }
}

export async function getRecents() {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  // 3일 이전 데이터 자동 삭제
  await cleanupOldRecents(user.uid);

  const q = query(collection(db, RECENT_COLLECTION), where('uid', '==', user.uid));
  const snapshot = await getDocs(q);

  // 클라이언트에서 정렬 후 제한
  const sortedDocs = snapshot.docs
    .sort((a, b) => {
      const aData = a.data();
      const bData = b.data();
      return (bData.playedAt || 0) - (aData.playedAt || 0);
    })
    .slice(0, MAX_RECENTS);

  return sortedDocs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      // 호환성을 위해 createdAt이 없으면 playedAt 사용
      createdAt: data.createdAt || data.playedAt,
    };
  });
}

// 수동 정리 함수 (필요시 사용)
export async function manualCleanupRecents() {
  const user = auth.currentUser;
  if (!user) throw new Error('로그인이 필요합니다');

  await cleanupOldRecents(user.uid);
}
