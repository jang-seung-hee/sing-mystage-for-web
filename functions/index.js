/**
 * YouTube 스트림 URL 추출을 위한 Firebase Functions
 * ytdl-core를 사용하여 광고 없는 고품질 스트림 URL 제공
 * 보안, 성능, 모니터링 최적화 적용
 */

const { setGlobalOptions } = require("firebase-functions");
const { onCall } = require("firebase-functions/v2/https");
const { getAuth } = require("firebase-admin/auth");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");
const ytdl = require("ytdl-core");
const yts = require("yt-search");
const cors = require("cors")({ origin: true });

// Firebase Admin 초기화
if (!admin.apps.length) {
  admin.initializeApp();
}

// Firestore 참조 (Rate Limiting용)
const firestore = admin.firestore();

// 글로벌 설정: 최대 인스턴스 수 제한 (비용 관리)
setGlobalOptions({ 
  maxInstances: 10,
  region: "asia-northeast3", // 한국 리전 사용
});

// Rate Limiting 설정
const RATE_LIMIT = {
  requests: 20, // 분당 요청 수
  windowMs: 60 * 1000, // 1분
  banDuration: 10 * 60 * 1000 // 10분 차단
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
  if (data.banned && (now - data.bannedAt) < RATE_LIMIT.banDuration) {
    throw new Error("너무 많은 요청으로 일시적으로 차단되었습니다. 10분 후 다시 시도해주세요.");
  }
  
  // 새로운 시간 윈도우 시작
  if (now - data.windowStart > RATE_LIMIT.windowMs) {
    await userLimitRef.set({
      requests: 1,
      windowStart: now,
      banned: false
    });
    return;
  }
  
  // Rate limit 초과 확인
  if (data.requests >= RATE_LIMIT.requests) {
    await userLimitRef.set({
      requests: data.requests,
      windowStart: data.windowStart,
      banned: true,
      bannedAt: now
    });
    throw new Error("요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.");
  }
  
  // 요청 카운트 증가
  await userLimitRef.set({
    requests: data.requests + 1,
    windowStart: data.windowStart,
    banned: false
  });
}

/**
 * YouTube 비디오 ID로부터 스트림 URL을 추출하는 함수
 * 인증된 사용자만 접근 가능
 */
exports.getStreamUrl = onCall(
  {
    region: "asia-northeast3",
    memory: "1GiB", // ytdl-core 처리에 충분한 메모리
    timeoutSeconds: 30, // 30초 타임아웃
    maxInstances: 5, // 이 함수의 최대 동시 실행 인스턴스
    cors: {
      origin: [
        /localhost:\d+$/,
        /\.firebaseapp\.com$/,
        /\.web\.app$/
      ],
      methods: ["POST"]
    }
  },
  async (request) => {
    const { data, auth } = request;
    let startTime = Date.now(); // 스코프를 전체 함수로 확장
    
    try {
      // 인증 확인
      if (!auth) {
        logger.warn("Unauthenticated access attempt", { 
          ip: request.rawRequest?.ip,
          userAgent: request.rawRequest?.headers?.['user-agent']
        });
        throw new Error("로그인이 필요합니다");
      }

      // Rate limiting 확인
      await checkRateLimit(auth.uid);

      // videoId 파라미터 확인 및 검증
      const { videoId } = data;
      if (!videoId) {
        logger.warn("Missing videoId parameter", { uid: auth.uid });
        throw new Error("비디오 ID가 필요합니다");
      }

      // videoId 형식 검증 (YouTube video ID는 11자리)
      if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        logger.warn("Invalid videoId format", { videoId, uid: auth.uid });
        throw new Error("유효하지 않은 비디오 ID 형식입니다");
      }

      logger.info("Stream URL request started", { 
        videoId, 
        uid: auth.uid,
        ip: request.rawRequest?.ip?.slice(0, 10) + "..." // IP 마스킹
      });

      // YouTube URL 검증
      if (!ytdl.validateURL(`https://www.youtube.com/watch?v=${videoId}`)) {
        logger.warn("Invalid YouTube URL", { videoId, uid: auth.uid });
        throw new Error("유효하지 않은 YouTube 비디오 ID입니다");
      }

      // 비디오 정보 및 스트림 URL 추출
      const info = await ytdl.getInfo(videoId);
      
      // 고품질 오디오 스트림 선택 (노래방 앱이므로 오디오 품질 우선)
      const audioFormats = ytdl.filterFormats(info.formats, 'audioonly');
      const bestAudioFormat = ytdl.chooseFormat(audioFormats, { 
        quality: 'highestaudio',
        filter: format => format.hasAudio && !format.hasVideo
      });

      if (!bestAudioFormat) {
        logger.error("No suitable audio format found", { 
          videoId, 
          uid: auth.uid,
          availableFormats: info.formats.length 
        });
        throw new Error("재생 가능한 오디오 스트림을 찾을 수 없습니다");
      }

      const processingTime = Date.now() - startTime;
      logger.info("Stream URL extracted successfully", {
        videoId,
        uid: auth.uid,
        processingTime,
        format: {
          quality: bestAudioFormat.quality,
          audioBitrate: bestAudioFormat.audioBitrate,
          mimeType: bestAudioFormat.mimeType
        }
      });

      return {
        success: true,
        streamUrl: bestAudioFormat.url,
        videoInfo: {
          title: info.videoDetails.title,
          duration: info.videoDetails.lengthSeconds,
          author: info.videoDetails.author.name
        },
        format: {
          quality: bestAudioFormat.quality,
          audioBitrate: bestAudioFormat.audioBitrate
        }
      };

    } catch (error) {
      const processingTime = Date.now() - (startTime || Date.now());
      
      // 에러 타입별 구체적인 한국어 메시지
      let errorMessage = "스트림 URL 추출에 실패했습니다";
      
      if (error.message.includes("Video unavailable")) {
        errorMessage = "비디오를 사용할 수 없습니다 (비공개 또는 삭제됨)";
      } else if (error.message.includes("Sign in to confirm")) {
        errorMessage = "연령 제한된 콘텐츠입니다";
      } else if (error.message.includes("Private video")) {
        errorMessage = "비공개 비디오입니다";
      } else if (error.message.includes("This live event")) {
        errorMessage = "라이브 스트림은 지원되지 않습니다";
      } else if (error.message.includes("YouTube said: Unable to extract")) {
        errorMessage = "YouTube에서 스트림 정보를 추출할 수 없습니다";
      } else if (error.message.includes("timeout")) {
        errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요";
      } else if (error.message.includes("유효하지 않은") || error.message.includes("재생 가능한")) {
        errorMessage = error.message; // 이미 한국어로 작성된 커스텀 에러
      }

      logger.error("Error in getStreamUrl", { 
        error: error.message,
        errorStack: error.stack,
        videoId: data?.videoId,
        uid: auth?.uid,
        processingTime,
        customMessage: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  }
);

// 헬스체크 함수 (모니터링 및 테스트용)
exports.healthCheck = onCall(
  { 
    region: "asia-northeast3",
    cors: true
  },
  async (request) => {
    const { auth } = request;
    
    try {
      // ytdl-core 동작 확인
      const testVideoId = "dQw4w9WgXcQ"; // Rick Roll (항상 사용 가능한 테스트 비디오)
      const isValid = ytdl.validateURL(`https://www.youtube.com/watch?v=${testVideoId}`);
      
      logger.info("Health check performed", { 
        uid: auth?.uid || "anonymous",
        ytdlStatus: isValid ? "working" : "failed"
      });
      
      return {
        status: "healthy",
        timestamp: new Date().toISOString(),
        message: "Firebase Functions가 정상적으로 동작 중입니다",
        services: {
          firebase: "operational",
          ytdlCore: isValid ? "operational" : "degraded",
          firestore: "operational"
        },
        region: "asia-northeast3",
        version: "1.0.0"
      };
    } catch (error) {
      logger.error("Health check failed", { 
        error: error.message,
        uid: auth?.uid || "anonymous"
      });
      
      return {
        status: "degraded",
        timestamp: new Date().toISOString(),
        message: "일부 서비스에 문제가 있습니다",
        error: error.message
      };
    }
  }
);

// 시스템 메트릭 함수 (관리자용)
exports.getMetrics = onCall(
  { 
    region: "asia-northeast3",
    cors: true
  },
  async (request) => {
    const { auth } = request;
    
    if (!auth) {
      throw new Error("인증이 필요합니다");
    }
    
    try {
      // Rate limit 통계
      const rateLimitSnapshot = await firestore.collection('rateLimits').get();
      const rateLimitStats = {
        totalUsers: rateLimitSnapshot.size,
        bannedUsers: 0,
        activeUsers: 0
      };
      
      const now = Date.now();
      rateLimitSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.banned && (now - data.bannedAt) < RATE_LIMIT.banDuration) {
          rateLimitStats.bannedUsers++;
        }
        if (now - data.windowStart < RATE_LIMIT.windowMs) {
          rateLimitStats.activeUsers++;
        }
      });
      
      logger.info("Metrics requested", { uid: auth.uid });
      
      return {
        timestamp: new Date().toISOString(),
        rateLimiting: rateLimitStats,
        system: {
          region: "asia-northeast3",
          maxInstances: 10,
          requestsPerMinute: RATE_LIMIT.requests
        }
      };
    } catch (error) {
      logger.error("Metrics retrieval failed", { 
        error: error.message,
        uid: auth.uid
      });
      throw new Error("메트릭 조회에 실패했습니다");
    }
  }
);

// 노래방 전용 검색 함수 (yt-search 기반)
exports.karaokeSearch = onCall(
  {
    region: "asia-northeast3",
    memory: "512MiB",
    timeoutSeconds: 15,
    maxInstances: 3,
    cors: {
      origin: [
        /localhost:\d+$/,
        /\.firebaseapp\.com$/,
        /\.web\.app$/
      ],
      methods: ["POST"]
    }
  },
  async (request) => {
    const { data, auth } = request;
    const startTime = Date.now();
    
    try {
      // 인증 확인
      if (!auth) {
        logger.warn("Unauthenticated karaoke search attempt", { 
          ip: request.rawRequest?.ip,
          userAgent: request.rawRequest?.headers?.['user-agent']
        });
        throw new Error("로그인이 필요합니다");
      }

      // Rate limiting 확인
      await checkRateLimit(auth.uid);

      // query 파라미터 확인
      const { query, maxResults = 10 } = data;
      if (!query || query.trim().length === 0) {
        logger.warn("Missing search query", { uid: auth.uid });
        throw new Error("검색어가 필요합니다");
      }

      // 검색어 길이 제한 (과도한 요청 방지)
      if (query.length > 100) {
        logger.warn("Search query too long", { query: query.substring(0, 50), uid: auth.uid });
        throw new Error("검색어가 너무 깁니다 (최대 100자)");
      }

      logger.info("Karaoke search request started", { 
        query: query.substring(0, 50), // 로그에는 처음 50자만 기록
        maxResults,
        uid: auth.uid,
        ip: request.rawRequest?.ip?.slice(0, 10) + "..." // IP 마스킹
      });

      // yt-search로 YouTube 검색 실행
      const searchResults = await yts(query);
      
      if (!searchResults || !searchResults.videos) {
        logger.warn("No search results found", { query, uid: auth.uid });
        throw new Error("검색 결과를 찾을 수 없습니다");
      }

      // 결과를 YouTube Data API 형식과 유사하게 변환
      const videos = searchResults.videos.slice(0, maxResults).map(video => ({
        id: {
          kind: "youtube#video",
          videoId: video.videoId
        },
        snippet: {
          publishedAt: video.ago, // yt-search는 정확한 날짜 대신 "ago" 제공
          channelId: video.author?.channelId || "",
          title: video.title,
          description: video.description || "",
          thumbnails: {
            default: {
              url: video.thumbnail,
              width: 120,
              height: 90
            },
            medium: {
              url: video.thumbnail,
              width: 320,
              height: 180
            },
            high: {
              url: video.thumbnail,
              width: 480,
              height: 360
            }
          },
          channelTitle: video.author?.name || "",
          liveBroadcastContent: "none"
        },
        // yt-search 추가 정보
        duration: video.duration,
        views: video.views,
        uploadedAt: video.ago
      }));

      const processingTime = Date.now() - startTime;
      logger.info("Karaoke search completed successfully", {
        query: query.substring(0, 50),
        resultsCount: videos.length,
        uid: auth.uid,
        processingTime
      });

      return {
        success: true,
        items: videos,
        searchInfo: {
          totalResults: searchResults.videos.length,
          searchType: "karaoke",
          query,
          processingTime
        }
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // 에러 타입별 구체적인 한국어 메시지
      let errorMessage = "노래방 검색에 실패했습니다";
      
      if (error.message.includes("timeout")) {
        errorMessage = "검색 요청 시간이 초과되었습니다. 다시 시도해주세요";
      } else if (error.message.includes("검색어가")) {
        errorMessage = error.message; // 이미 한국어로 작성된 커스텀 에러
      } else if (error.message.includes("검색 결과를")) {
        errorMessage = error.message; // 이미 한국어로 작성된 커스텀 에러
      } else if (error.message.includes("네트워크") || error.message.includes("ENOTFOUND")) {
        errorMessage = "네트워크 연결에 문제가 있습니다. 다시 시도해주세요";
      }

      logger.error("Error in karaokeSearch", { 
        error: error.message,
        errorStack: error.stack,
        query: data?.query?.substring(0, 50),
        uid: auth?.uid,
        processingTime,
        customMessage: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  }
);
