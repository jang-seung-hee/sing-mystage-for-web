import React, { useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Loader2, AlertCircle, Music, Play } from 'lucide-react';

interface PlayerProps {
  videoId: string;
  adFree: boolean;
  streamUrl: string | null;
  title?: string;
  loading?: boolean;
  error?: string | null;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onEnded?: () => void;
}

export interface PlayerRef {
  seek: (time: number) => void;
  play: () => void;
  pause: () => void;
  toggle: () => void;
}

// recordUsage API 호출 함수
async function recordUsage({ type, userId, date, seconds }: {
  type: 'usage_time',
  userId: string,
  date: string,
  seconds: number,
}) {
  try {
    await fetch('https://asia-northeast3-' + process.env.REACT_APP_FIREBASE_PROJECT_ID + '.cloudfunctions.net/recordUsage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, userId, date, seconds }),
    });
  } catch (e) {
    // 집계 실패는 무시
  }
}

const Player = forwardRef<PlayerRef, PlayerProps>(
  (
    { videoId, adFree, streamUrl, title, loading, error, onTimeUpdate, onPlayStateChange, onEnded },
    ref,
  ) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // 누적 재생 시간 집계용
    const lastSentTimeRef = useRef<number>(0);
    const totalPlayedRef = useRef<number>(0);
    const lastUserIdRef = useRef<string | null>(null);
    const lastDateRef = useRef<string | null>(null);
    
    // localStorage 캐싱용
    const cachedUserIdRef = useRef<string | null>(null);
    const cachedDateRef = useRef<string | null>(null);

    // 부모 컴포넌트에서 호출할 수 있는 메소드들 노출
    useImperativeHandle(ref, () => ({
      seek: (time: number) => {
        const video = videoRef.current;
        if (video && adFree) {
          // adFree 비디오의 경우 직접 시간 변경
          video.currentTime = time;
        } else if (!adFree) {
          // YouTube iframe의 경우 시뮬레이션 시간 조정
          const newStartTime = Date.now() - time * 1000;
          localStorage.setItem('videoStartTime', newStartTime.toString());

          if (process.env.NODE_ENV === 'development') {
            console.log('YouTube iframe seek:', {
              targetTime: time,
              newStartTime: newStartTime,
              currentTime: Date.now(),
            });
          }

          // 즉시 시간 업데이트 호출
          if (onTimeUpdate) {
            onTimeUpdate(time, 300);
          }
        }
      },
      play: () => {
        const video = videoRef.current;
        if (video && adFree) {
          video.play();
        } else if (!adFree) {
          // YouTube iframe의 경우 localStorage로 재생 상태 관리
          localStorage.setItem('videoPaused', 'false');
          // 현재 시간 기준으로 시작 시간 재조정
          const currentTime = parseFloat(localStorage.getItem('currentSimTime') || '0');
          const newStartTime = Date.now() - currentTime * 1000;
          localStorage.setItem('videoStartTime', newStartTime.toString());

          if (onPlayStateChange) {
            onPlayStateChange(true);
          }
        }
      },
      pause: () => {
        const video = videoRef.current;
        if (video && adFree) {
          video.pause();
        } else if (!adFree) {
          // YouTube iframe의 경우 localStorage로 일시정지 상태 관리
          localStorage.setItem('videoPaused', 'true');
          // 현재 시간을 저장
          const startTime = localStorage.getItem('videoStartTime');
          if (startTime) {
            const currentTime = (Date.now() - parseInt(startTime)) / 1000;
            localStorage.setItem('currentSimTime', currentTime.toString());
          }

          if (onPlayStateChange) {
            onPlayStateChange(false);
          }
        }
      },
      toggle: () => {
        const video = videoRef.current;
        if (video && adFree) {
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
        } else if (!adFree) {
          // YouTube iframe의 경우 localStorage 상태 확인
          const isPaused = localStorage.getItem('videoPaused') === 'true';
          if (isPaused) {
            // play 호출
            localStorage.setItem('videoPaused', 'false');
            const currentTime = parseFloat(localStorage.getItem('currentSimTime') || '0');
            const newStartTime = Date.now() - currentTime * 1000;
            localStorage.setItem('videoStartTime', newStartTime.toString());

            if (onPlayStateChange) {
              onPlayStateChange(true);
            }
          } else {
            // pause 호출
            localStorage.setItem('videoPaused', 'true');
            const startTime = localStorage.getItem('videoStartTime');
            if (startTime) {
              const currentTime = (Date.now() - parseInt(startTime)) / 1000;
              localStorage.setItem('currentSimTime', currentTime.toString());
            }

            if (onPlayStateChange) {
              onPlayStateChange(false);
            }
          }
        }
      },
    }));

    // YouTube iframe의 경우 임시 시간 시뮬레이션 (실제 YouTube API는 별도 구현 필요)
    useEffect(() => {
      // 기존 interval 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      if (!adFree && onTimeUpdate && streamUrl) {
        // 새로운 비디오가 시작될 때 시간 초기화
        const startTime = Date.now();
        localStorage.setItem('videoStartTime', startTime.toString());
        localStorage.setItem('videoPaused', 'false');

        // 즉시 한 번 실행하여 초기 시간 설정
        const simulatedDuration = 300; // 5분
        onTimeUpdate(0, simulatedDuration);

        // 초기 재생 상태도 설정
        if (onPlayStateChange) {
          onPlayStateChange(true); // YouTube 비디오는 기본적으로 재생 상태로 시작
        }

        // iframe의 경우 임시로 시간을 시뮬레이션 (YouTube API 미사용 시)
        intervalRef.current = setInterval(() => {
          const now = Date.now();
          const startTimeStr = localStorage.getItem('videoStartTime');
          const isPaused = localStorage.getItem('videoPaused') === 'true';

          if (startTimeStr && !isPaused) {
            const elapsed = (now - parseInt(startTimeStr)) / 1000;
            const currentTime = Math.min(elapsed, simulatedDuration);

            // 시간 시뮬레이션 (로그 제거로 성능 개선)

            onTimeUpdate(currentTime, simulatedDuration);

            // 재생 상태도 업데이트
            if (onPlayStateChange) {
              onPlayStateChange(true);
            }

            // 비디오가 끝났으면 일시정지 상태로 변경
            if (currentTime >= simulatedDuration) {
              localStorage.setItem('videoPaused', 'true');
              if (onPlayStateChange) {
                onPlayStateChange(false);
              }
            }
          } else if (isPaused && onPlayStateChange) {
            // 일시정지 상태일 때도 상태 업데이트
            onPlayStateChange(false);
          }
        }, 1000); // 성능 최적화를 위해 1000ms로 변경
      } else if (adFree) {
        // adFree 비디오의 경우 localStorage 초기화
        localStorage.removeItem('videoStartTime');
        localStorage.removeItem('videoPaused');
      }

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }, [adFree, onTimeUpdate, streamUrl, videoId, onPlayStateChange]); // videoId와 onPlayStateChange도 의존성 추가

    // adFree 비디오의 이벤트 리스너 최적화
    useEffect(() => {
      const video = videoRef.current;
      if (adFree && video && streamUrl) {
        // 비디오 로드 시도
        video.load();

        // 초기 시간 설정 및 자동 재생 시도 (최적화된 이벤트 리스너)
        const initializeTime = () => {
          if (video.duration && !isNaN(video.duration)) {
            if (onTimeUpdate) {
              onTimeUpdate(video.currentTime || 0, video.duration);
            }
            if (onPlayStateChange) {
              onPlayStateChange(!video.paused);
            }

            // 자동 재생 시도
            video.play().catch((error) => {
              console.log('자동 재생 실패 (사용자 상호작용 필요):', error);
            });

            if (process.env.NODE_ENV === 'development') {
              console.log('비디오 초기화 완료:', {
                currentTime: video.currentTime || 0,
                duration: video.duration,
                readyState: video.readyState,
              });
            }
          }
        };

        // loadedmetadata 이벤트만 사용하여 최적화
        video.addEventListener('loadedmetadata', initializeTime);

        return () => {
          video.removeEventListener('loadedmetadata', initializeTime);
        };
      }
    }, [adFree, streamUrl, onTimeUpdate, onPlayStateChange]);

    // 비디오 시간 업데이트 핸들러
    const handleTimeUpdate = () => {
      const video = videoRef.current;
      if (video && onTimeUpdate) {
        const currentTime = video.currentTime || 0;
        const duration = video.duration || 0;

        // 유효한 시간 값인지 확인
        if (!isNaN(currentTime) && !isNaN(duration) && duration > 0) {
          // 시간 업데이트 (로그 제거로 성능 개선)
          onTimeUpdate(currentTime, duration);

          // --- 누적 재생 시간 집계 (최적화된 localStorage 접근) ---
          // 캐시된 값이 없으면 localStorage에서 가져와서 캐시
          if (!cachedUserIdRef.current || !cachedDateRef.current) {
            cachedUserIdRef.current = localStorage.getItem('usage_userId');
            cachedDateRef.current = localStorage.getItem('usage_date');
          }
          
          const userId = cachedUserIdRef.current;
          const date = cachedDateRef.current;
          
          if (userId && date) {
            // 10초 단위로만 전송
            const now = Math.floor(Date.now() / 1000);
            if (!lastSentTimeRef.current || now - lastSentTimeRef.current >= 10) {
              // 누적 재생 시간 계산 (10초 단위)
              totalPlayedRef.current += 10;
              recordUsage({ type: 'usage_time', userId, date, seconds: 10 });
              lastSentTimeRef.current = now;
              lastUserIdRef.current = userId;
              lastDateRef.current = date;
            }
          }
        }
      }
    };

    // 비디오 재생 상태 변경 핸들러
    const handlePlayStateChange = () => {
      const video = videoRef.current;
      if (video && onPlayStateChange) {
        const isPlaying = !video.paused;

        // 재생 상태 변경 (로그 제거로 성능 개선)

        onPlayStateChange(isPlaying);
      }
    };

    // 비디오 메타데이터 로드 완료 핸들러
    const handleLoadedMetadata = () => {
      const video = videoRef.current;
      if (video) {
        const currentTime = video.currentTime || 0;
        const duration = video.duration || 0;

        // 메타데이터 로드 완료 (로그 제거로 성능 개선)

        if (onTimeUpdate) {
          onTimeUpdate(currentTime, duration);
        }
        if (onPlayStateChange) {
          onPlayStateChange(!video.paused);
        }
      }
    };

    if (loading) {
      return (
        <div className="flex items-center justify-center h-full bg-dark-card rounded-lg relative overflow-hidden">
          {/* 로딩 배경 효과 */}
          <div className="absolute inset-0 bg-gradient-neon opacity-20 animate-pulse"></div>

          {/* 로딩 스피너와 메시지 */}
          <div className="text-center space-y-4 z-10">
            <div className="relative">
              <Loader2 size={48} className="text-neon-cyan animate-spin mx-auto" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Music size={20} className="text-neon-pink animate-pulse" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-neon-cyan text-lg font-bold">영상 로딩 중...</div>
              <div className="text-gray-300 text-sm">잠시만 기다려 주세요</div>
            </div>
          </div>

          {/* 로딩 파티클 */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-neon-cyan rounded-full animate-bounce-glow"></div>
            <div
              className="absolute top-1/3 right-1/4 w-1 h-1 bg-neon-pink rounded-full animate-bounce-glow"
              style={{ animationDelay: '1s' }}
            ></div>
            <div
              className="absolute bottom-1/3 right-1/3 w-1 h-1 bg-neon-yellow rounded-full animate-bounce-glow"
              style={{ animationDelay: '2s' }}
            ></div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-full bg-dark-card rounded-lg border border-red-600 relative overflow-hidden">
          {/* 에러 배경 효과 */}
          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-800 to-red-900 opacity-20"></div>

          {/* 에러 메시지 */}
          <div className="text-center space-y-4 z-10">
            <AlertCircle size={48} className="text-red-400 mx-auto animate-pulse" />
            <div className="space-y-2">
              <div className="text-red-400 text-lg font-bold">재생 오류</div>
              <div className="text-gray-300 text-sm max-w-md">{error}</div>
              <div className="text-gray-400 text-xs">다른 노래를 선택해 보세요</div>
            </div>
          </div>
        </div>
      );
    }

    if (!streamUrl) {
      return (
        <div className="flex items-center justify-center h-full bg-dark-card rounded-lg">
          <div className="text-center space-y-4">
            <Play size={48} className="text-neon-cyan mx-auto animate-pulse-glow" />
            <div className="text-gray-400">영상을 준비하는 중...</div>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col relative">
        {/* 비디오 플레이어 영역 */}
        <div className="flex-1 relative rounded-lg overflow-hidden">
          {/* 네온 테두리 효과 최소화 */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow p-0.5 rounded-lg opacity-10">
            <div className="w-full h-full bg-black rounded-lg"></div>
          </div>

          {/* 실제 비디오 요소 */}
          <div className="relative z-10 w-full h-full video-container">
            {adFree ? (
              <video
                ref={videoRef}
                src={streamUrl}
                controls
                autoPlay
                preload="auto"
                className="video-responsive rounded-lg shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(0, 255, 255, 0.3))',
                }}
                onTimeUpdate={handleTimeUpdate}
                onPlay={handlePlayStateChange}
                onPause={handlePlayStateChange}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={onEnded}
              />
            ) : (
              <iframe
                ref={iframeRef}
                src={streamUrl}
                title="YouTube Video"
                className="w-full h-full rounded-lg shadow-2xl"
                style={{
                  filter: 'drop-shadow(0 0 20px rgba(255, 0, 255, 0.3))',
                }}
                allowFullScreen
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                onLoad={() => {
                  // iframe 로드 완료
                }}
              />
            )}
          </div>

          {/* 코너 장식 */}
          <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-neon-cyan opacity-60 z-20"></div>
          <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-neon-pink opacity-60 z-20"></div>
          <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-neon-yellow opacity-60 z-20"></div>
          <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-neon-cyan opacity-60 z-20"></div>
        </div>
      </div>
    );
  },
);

Player.displayName = 'Player';

export default Player;
