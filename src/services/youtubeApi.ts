import axios from 'axios';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import { YouTubeSearchResults } from '../types/youtube';

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

// Firebase Functions 호출 함수들
const getStreamUrlFunction = httpsCallable(functions, 'getStreamUrl');
const karaokeSearchFunction = httpsCallable(functions, 'karaokeSearch');

export async function searchYouTube(query: string): Promise<YouTubeSearchResults> {
  const res = await axios.get(`${YOUTUBE_API_BASE}/search`, {
    params: {
      part: 'snippet',
      q: query,
      key: process.env.REACT_APP_YOUTUBE_API_KEY,
      maxResults: 10,
      type: 'video',
    },
  });
  return (res.data as any).items;
}

/**
 * 노래방 전용 검색 함수 (yt-search 기반)
 * YouTube 공식 API로 접근하기 어려운 TJ노래방 등의 영상도 검색 가능
 */
export async function searchKaraoke(query: string, maxResults = 10): Promise<YouTubeSearchResults> {
  try {
    // Firebase Functions 호출
    const result = await karaokeSearchFunction({ query, maxResults });
    const data = result.data as any;

    if (data.success && data.items) {
      return data.items;
    }

    // 성공 플래그가 false이거나 items가 없는 경우
    throw new Error(data.error || 'Firebase Functions에서 검색 결과를 반환하지 않았습니다');

  } catch (error: any) {
    // Firebase Functions 에러 처리
    if (error.code === 'functions/unauthenticated') {
      throw new Error('로그인이 필요합니다');
    } else if (error.code === 'functions/permission-denied') {
      throw new Error('노래방 검색 권한이 없습니다');
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error('검색 요청 시간이 초과되었습니다. 다시 시도해주세요');
    } else if (error.code === 'functions/unavailable') {
      throw new Error('노래방 검색 서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요');
    } else if (error.message) {
      // Firebase Functions에서 전달된 커스텀 에러 메시지 (한국어)
      throw new Error(error.message);
    } else {
      // 알 수 없는 에러
      console.error('searchKaraoke error:', error);
      throw new Error('노래방 검색 중 알 수 없는 오류가 발생했습니다');
    }
  }
}

/**
 * YouTube 비디오 ID로부터 스트림 URL을 추출합니다
 * Firebase Functions를 통해 ytdl-core로 처리됩니다
 */
export async function getAdFreeStreamUrl(videoId: string): Promise<string> {
  try {
    // Firebase Functions 호출
    const result = await getStreamUrlFunction({ videoId });
    const data = result.data as any;

    if (data.success && data.streamUrl) {
      return data.streamUrl;
    }

    // 성공 플래그가 false이거나 streamUrl이 없는 경우
    throw new Error(data.error || 'Firebase Functions에서 스트림 URL을 반환하지 않았습니다');

  } catch (error: any) {
    // Firebase Functions 에러 처리
    if (error.code === 'functions/unauthenticated') {
      throw new Error('로그인이 필요합니다');
    } else if (error.code === 'functions/permission-denied') {
      throw new Error('스트림 URL 추출 권한이 없습니다');
    } else if (error.code === 'functions/deadline-exceeded') {
      throw new Error('요청 시간이 초과되었습니다. 다시 시도해주세요');
    } else if (error.code === 'functions/unavailable') {
      throw new Error('서비스가 일시적으로 사용할 수 없습니다. 잠시 후 다시 시도해주세요');
    } else if (error.message) {
      // Firebase Functions에서 전달된 커스텀 에러 메시지 (한국어)
      throw new Error(error.message);
    } else {
      // 알 수 없는 에러
      console.error('getAdFreeStreamUrl error:', error);
      throw new Error('스트림 URL 추출 중 알 수 없는 오류가 발생했습니다');
    }
  }
}
