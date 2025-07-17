/*
 * YouTube 스트림 URL 추출을 위한 Firebase Functions
 * youtubei.js를 사용하여 광고 없는 고품질 스트림 URL 제공
 * 보안, 성능, 모니터링 최적화 적용
 */

const { setGlobalOptions } = require('firebase-functions');
const { onCall } = require('firebase-functions/v2/https');
const { getAuth } = require('firebase-admin/auth');
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');
const { Innertube } = require('youtubei.js');
const querystring = require('querystring');
let ytInstance = null;
let ytInitPromise = null;
function getYtInstance() {
  if (ytInstance) return Promise.resolve(ytInstance);
  if (!ytInitPromise) {
    ytInitPromise = Innertube.create().then((instance) => {
      ytInstance = instance;
      return ytInstance;
    });
  }
  return ytInitPromise;
}
function getUrlFromFormat(format) {
  if (format.url) return format.url;
  const cipher = format.signatureCipher || format.cipher;
  if (cipher) {
    const params = querystring.parse(cipher);
    if (params.url) {
      if (params.sig) return params.url + '&sig=' + params.sig;
      if (params.s) return params.url + '&sig=' + params.s;
      return params.url;
    }
  }
  return null;
}
const cors = require('cors')({ origin: true });

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

// Firestore 참조 (Rate Limiting용)
const firestore = admin.firestore();

// 글로벌 설정: 최대 인스턴스 수 제한 (비용 관리)
setGlobalOptions({
  maxInstances: 10,
  region: 'asia-northeast3', // 한국 리전 사용
});

// Rate Limiting 설정
const RATE_LIMIT = {
  requests: 20, // 분당 요청 수
  windowMs: 60 * 1000, // 1분
  banDuration: 10 * 60 * 1000, // 10분 차단
};

/**
 * Rate Limiting 확인 함수
 */
async function checkRateLimit(uid) {
  const now = Date.now();
  const userLimitRef = firestore.collection('rateLimits').doc(uid);

  const doc = await userLimitRef.get();
  const data = doc.data() || { requests: 0, windowStart: now, banned: false };

  // 차단 상태 확인
  if (data.banned && now - data.bannedAt < RATE_LIMIT.banDuration) {
    throw new Error('너무 많은 요청으로 일시적으로 차단되었습니다. 10분 후 다시 시도해주세요.');
  }

  // 새로운 시간 윈도우 시작
  if (now - data.windowStart > RATE_LIMIT.windowMs) {
    await userLimitRef.set({
      requests: 1,
      windowStart: now,
      banned: false,
    });
    return;
  }

  // Rate limit 초과 확인
  if (data.requests >= RATE_LIMIT.requests) {
    await userLimitRef.set({
      requests: data.requests,
      windowStart: data.windowStart,
      banned: true,
      bannedAt: now,
    });
    throw new Error('요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.');
  }

  // 요청 카운트 증가
  await userLimitRef.set({
    requests: data.requests + 1,
    windowStart: data.windowStart,
    banned: false,
  });
}

/**
 * YouTube 비디오 ID로부터 스트림 URL을 추출하는 함수
 * 인증된 사용자만 접근 가능
 */
exports.getStreamUrl = onCall(
  {
    region: 'asia-northeast3',
    memory: '1GiB',
    timeoutSeconds: 30,
    maxInstances: 5,
    cors: {
      origin: [/localhost:\d+$/, /\.firebaseapp\.com$/, /\.web\.app$/],
      allowMethods: ['POST'],
    },
  },
  async (request) => {
    const { data, auth } = request;
    let startTime = Date.now();
    try {
      // [로컬 테스트용] 인증 체크 임시 비활성화 (실서비스 배포 전 반드시 복구!)
      if (!auth) {
        logger.warn('Unauthenticated access attempt', {
          ip: request.rawRequest?.ip,
          userAgent: request.rawRequest?.headers?.['user-agent'],
        });
        throw new Error('로그인이 필요합니다');
      }
      // 인증이 없으면 테스트용 임시 uid 사용 (실서비스 배포 전 반드시 복구!)
      await checkRateLimit(auth?.uid || 'test-uid');
      const { videoId } = data;
      if (!videoId) {
        logger.warn('Missing videoId parameter', { uid: auth?.uid || 'test-uid' });
        throw new Error('비디오 ID가 필요합니다');
      }
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        logger.warn('Invalid videoId format', { videoId, uid: auth?.uid || 'test-uid' });
        throw new Error('유효하지 않은 비디오 ID 형식입니다');
      }
      logger.info('Stream URL request started', {
        videoId,
        uid: auth?.uid || 'test-uid',
        ip: request.rawRequest?.ip?.slice(0, 10) + '...',
      });
      // youtubei.js 기반으로 비디오 정보 및 스트림 URL 추출
      const yt = await getYtInstance();
      let info;
      try {
        info = await yt.getInfo(videoId);
        logger.info('youtubei.js getInfo 반환값', { info });
      } catch (err) {
        logger.warn('youtubei.js getInfo 실패', {
          videoId,
          uid: auth?.uid || 'test-uid',
          err: err.message,
        });
        throw new Error('유효하지 않은 YouTube 비디오 ID입니다');
      }
      if (!info || !info.streaming_data || !info.streaming_data.adaptive_formats) {
        logger.error('No streaming data found', { videoId, uid: auth?.uid || 'test-uid' });
        throw new Error('재생 가능한 오디오 스트림을 찾을 수 없습니다');
      }
      // 오디오 스트림 추출 로직 개선 (여러 필드 fallback, mime_type/mimeType 모두 대응)
      let audioFormats = [];
      if (info.streaming_data?.adaptive_formats) {
        audioFormats = info.streaming_data.adaptive_formats.filter((f) =>
          (f.mime_type || f.mimeType)?.startsWith('audio/'),
        );
      }
      if (audioFormats.length === 0 && info.streaming_data?.formats) {
        audioFormats = info.streaming_data.formats.filter((f) =>
          (f.mime_type || f.mimeType)?.startsWith('audio/'),
        );
      }
      if (audioFormats.length === 0 && info.adaptiveFormats) {
        audioFormats = info.adaptiveFormats.filter((f) =>
          (f.mime_type || f.mimeType)?.startsWith('audio/'),
        );
      }
      if (audioFormats.length === 0 && info.formats) {
        audioFormats = info.formats.filter((f) =>
          (f.mime_type || f.mimeType)?.startsWith('audio/'),
        );
      }
      // 진단용: audioFormats 구조를 로그로 출력
      logger.info('audioFormats 구조', { audioFormats });
      // url 또는 signatureCipher/cipher가 있는 오디오 포맷만 playableFormats로 추출
      let playableFormats = audioFormats
        .map((f) => ({ ...f, _url: getUrlFromFormat(f) }))
        .filter((f) => !!f._url);
      // fallback: playableFormats가 없더라도, audioFormats가 있다면 첫 번째 것을 시도
      if (playableFormats.length === 0 && audioFormats.length > 0) {
        playableFormats = audioFormats.map((f) => ({ ...f, _url: getUrlFromFormat(f) }));
      }
      // bitrate가 가장 높은 오디오 스트림을 우선 선택
      const bestAudio = playableFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];
      if (!bestAudio || !bestAudio._url) {
        throw new Error('재생 가능한 오디오 스트림을 찾을 수 없습니다');
      }
      const streamUrl = bestAudio._url;
      const processingTime = Date.now() - startTime;
      logger.info('Stream URL extracted successfully', {
        videoId,
        uid: auth?.uid || 'test-uid',
        processingTime,
        format: {
          quality: bestAudio.qualityLabel || bestAudio.quality,
          audioBitrate: bestAudio.bitrate,
          mimeType: bestAudio.mime_type,
        },
      });
      return {
        success: true,
        streamUrl: streamUrl,
        videoInfo: {
          title: info.basic_info?.title || info.details?.title || '',
          duration: info.basic_info?.duration || info.details?.duration_seconds || '',
          author: info.basic_info?.author || info.details?.author || '',
        },
        format: {
          quality: bestAudio.qualityLabel || bestAudio.quality,
          audioBitrate: bestAudio.bitrate,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - (startTime || Date.now());
      let errorMessage = '스트림 URL 추출에 실패했습니다';
      if (error.message.includes('Video unavailable')) {
        errorMessage = '비디오를 사용할 수 없습니다 (비공개 또는 삭제됨)';
      } else if (error.message.includes('Sign in to confirm')) {
        errorMessage = '연령 제한된 콘텐츠입니다';
      } else if (error.message.includes('Private video')) {
        errorMessage = '비공개 비디오입니다';
      } else if (error.message.includes('This live event')) {
        errorMessage = '라이브 스트림은 지원되지 않습니다';
      } else if (error.message.includes('No streaming data')) {
        errorMessage = 'YouTube에서 스트림 정보를 추출할 수 없습니다';
      } else if (error.message.includes('timeout')) {
        errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요';
      } else if (error.message.includes('유효하지 않은') || error.message.includes('재생 가능한')) {
        errorMessage = error.message;
      }
      logger.error('Error in getStreamUrl', {
        error: error.message,
        errorStack: error.stack,
        videoId: data?.videoId,
        uid: auth?.uid || 'test-uid',
        processingTime,
        customMessage: errorMessage,
      });
      throw new Error(
        errorMessage + ': ' + (error && error.message ? error.message : JSON.stringify(error)),
      );
    }
  },
);

// 헬스체크 함수 (모니터링 및 테스트용)
exports.healthCheck = onCall(
  {
    region: 'asia-northeast3',
    cors: true,
  },
  async (request) => {
    const { auth } = request;
    try {
      const testVideoId = 'dQw4w9WgXcQ';
      if (!ytInstance) {
        throw new Error('YouTube API 초기화 중입니다');
      }
      let isValid = false;
      try {
        const info = await ytInstance.getInfo(testVideoId);
        isValid = !!(info && info.streaming_data && info.streaming_data.adaptive_formats);
      } catch (e) {
        isValid = false;
      }
      logger.info('Health check performed', {
        uid: auth?.uid || 'anonymous',
        youtubeiStatus: isValid ? 'working' : 'failed',
      });
      return {
        status: isValid ? 'healthy' : 'degraded',
        timestamp: new Date().toISOString(),
        message: isValid
          ? 'Firebase Functions가 정상적으로 동작 중입니다'
          : 'youtubei.js 동작에 문제가 있습니다',
        services: {
          firebase: 'operational',
          youtubei: isValid ? 'operational' : 'degraded',
          firestore: 'operational',
        },
        region: 'asia-northeast3',
        version: '1.0.0',
      };
    } catch (error) {
      logger.error('Health check failed', {
        error: error.message,
        uid: auth?.uid || 'anonymous',
      });
      return {
        status: 'degraded',
        timestamp: new Date().toISOString(),
        message: '일부 서비스에 문제가 있습니다',
        error: error.message,
      };
    }
  },
);

// 시스템 메트릭 함수 (관리자용)
exports.getMetrics = onCall(
  {
    region: 'asia-northeast3',
    cors: true,
  },
  async (request) => {
    const { auth } = request;

    if (!auth) {
      throw new Error('인증이 필요합니다');
    }

    try {
      // Rate limit 통계
      const rateLimitSnapshot = await firestore.collection('rateLimits').get();
      const rateLimitStats = {
        totalUsers: rateLimitSnapshot.size,
        bannedUsers: 0,
        activeUsers: 0,
      };

      const now = Date.now();
      rateLimitSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.banned && now - data.bannedAt < RATE_LIMIT.banDuration) {
          rateLimitStats.bannedUsers++;
        }
        if (now - data.windowStart < RATE_LIMIT.windowMs) {
          rateLimitStats.activeUsers++;
        }
      });

      logger.info('Metrics requested', { uid: auth.uid });

      return {
        timestamp: new Date().toISOString(),
        rateLimiting: rateLimitStats,
        system: {
          region: 'asia-northeast3',
          maxInstances: 10,
          requestsPerMinute: RATE_LIMIT.requests,
        },
      };
    } catch (error) {
      logger.error('Metrics retrieval failed', {
        error: error.message,
        uid: auth.uid,
      });
      throw new Error('메트릭 조회에 실패했습니다');
    }
  },
);

// 노래방 전용 검색 함수 (yt-search 기반)
exports.karaokeSearch = onCall(
  {
    region: 'asia-northeast3',
    memory: '512MiB',
    timeoutSeconds: 15,
    maxInstances: 3,
    cors: {
      origin: [/localhost:\d+$/, /\.firebaseapp\.com$/, /\.web\.app$/],
      methods: ['POST'],
    },
  },
  async (request) => {
    const { data, auth } = request;
    const startTime = Date.now();

    try {
      // 인증 확인
      if (!auth) {
        logger.warn('Unauthenticated karaoke search attempt', {
          ip: request.rawRequest?.ip,
          userAgent: request.rawRequest?.headers?.['user-agent'],
        });
        throw new Error('로그인이 필요합니다');
      }

      // Rate limiting 확인
      await checkRateLimit(auth.uid);

      // query 파라미터 확인
      const { query, maxResults = 10 } = data;
      if (!query || query.trim().length === 0) {
        logger.warn('Missing search query', { uid: auth.uid });
        throw new Error('검색어가 필요합니다');
      }

      // 검색어 길이 제한 (과도한 요청 방지)
      if (query.length > 100) {
        logger.warn('Search query too long', { query: query.substring(0, 50), uid: auth.uid });
        throw new Error('검색어가 너무 깁니다 (최대 100자)');
      }

      logger.info('Karaoke search request started', {
        query: query.substring(0, 50), // 로그에는 처음 50자만 기록
        maxResults,
        uid: auth.uid,
        ip: request.rawRequest?.ip?.slice(0, 10) + '...', // IP 마스킹
      });

      // yt-search로 YouTube 검색 실행
      const searchResults = await yts(query);

      if (!searchResults || !searchResults.videos) {
        logger.warn('No search results found', { query, uid: auth.uid });
        throw new Error('검색 결과를 찾을 수 없습니다');
      }

      // 결과를 YouTube Data API 형식과 유사하게 변환
      const videos = searchResults.videos.slice(0, maxResults).map((video) => ({
        id: {
          kind: 'youtube#video',
          videoId: video.videoId,
        },
        snippet: {
          publishedAt: video.ago, // yt-search는 정확한 날짜 대신 "ago" 제공
          channelId: video.author?.channelId || '',
          title: video.title,
          description: video.description || '',
          thumbnails: {
            default: {
              url: video.thumbnail,
              width: 120,
              height: 90,
            },
            medium: {
              url: video.thumbnail,
              width: 320,
              height: 180,
            },
            high: {
              url: video.thumbnail,
              width: 480,
              height: 360,
            },
          },
          channelTitle: video.author?.name || '',
          liveBroadcastContent: 'none',
        },
        // yt-search 추가 정보
        duration: video.duration,
        views: video.views,
        uploadedAt: video.ago,
      }));

      const processingTime = Date.now() - startTime;
      logger.info('Karaoke search completed successfully', {
        query: query.substring(0, 50),
        resultsCount: videos.length,
        uid: auth.uid,
        processingTime,
      });

      return {
        success: true,
        items: videos,
        searchInfo: {
          totalResults: searchResults.videos.length,
          searchType: 'karaoke',
          query,
          processingTime,
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      // 에러 타입별 구체적인 한국어 메시지
      let errorMessage = '노래방 검색에 실패했습니다';

      if (error.message.includes('timeout')) {
        errorMessage = '검색 요청 시간이 초과되었습니다. 다시 시도해주세요';
      } else if (error.message.includes('검색어가')) {
        errorMessage = error.message; // 이미 한국어로 작성된 커스텀 에러
      } else if (error.message.includes('검색 결과를')) {
        errorMessage = error.message; // 이미 한국어로 작성된 커스텀 에러
      } else if (error.message.includes('네트워크') || error.message.includes('ENOTFOUND')) {
        errorMessage = '네트워크 연결에 문제가 있습니다. 다시 시도해주세요';
      }

      logger.error('Error in karaokeSearch', {
        error: error.message,
        errorStack: error.stack,
        query: data?.query?.substring(0, 50),
        uid: auth?.uid,
        processingTime,
        customMessage: errorMessage,
      });

      throw new Error(errorMessage);
    }
  },
);
