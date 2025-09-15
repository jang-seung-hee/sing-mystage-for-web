import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YouTubeIframePlayerProps = {
  videoId: string;
  // 연속재생을 위한 플레이리스트 전달 (선택)
  playlistIds?: string[];
  startIndex?: number;
  loop?: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onEnded?: () => void;
  onPlayerReady?: () => void; // 플레이어 준비 완료 콜백 추가
};

export type YouTubeIframeRef = {
  play: () => void;
  pause: () => void;
  seek: (time: number) => void;
};

const YouTubeIframePlayer = forwardRef<YouTubeIframeRef, YouTubeIframePlayerProps>(
  ({ videoId, playlistIds, startIndex, loop, onTimeUpdate, onPlayStateChange, onEnded, onPlayerReady }, ref) => {
    // React가 관리하는 안전한 래퍼 컨테이너 (이 래퍼는 절대 교체/삭제되지 않음)
    const containerRef = useRef<HTMLDivElement | null>(null);
    // YouTube가 교체할 실제 플레이어용 플레이스홀더(DOM 노드)를 React 바깥에서 동적 생성/관리
    const placeholderRef = useRef<HTMLDivElement | null>(null);
    const playerRef = useRef<any>(null);
    const timerRef = useRef<number | null>(null);
    const endedCalledRef = useRef<boolean>(false);
    const lastCurrentTimeRef = useRef<number>(0);
    const stuckTimeRef = useRef<number>(0);
    // 최신 props 참조용 ref
    const playlistIdsRef = useRef<string[] | undefined>(playlistIds);
    const startIndexRef = useRef<number | undefined>(startIndex);
    const videoIdRef = useRef<string>(videoId);
    const loopRef = useRef<boolean | undefined>(loop);

    useEffect(() => { playlistIdsRef.current = playlistIds; }, [playlistIds]);
    useEffect(() => { startIndexRef.current = startIndex; }, [startIndex]);
    useEffect(() => { videoIdRef.current = videoId; }, [videoId]);
    useEffect(() => { loopRef.current = loop; }, [loop]);

    // Load IFrame API once
    useEffect(() => {
      if (typeof window === 'undefined') return;
      if (window.YT && window.YT.Player) return;
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (existing) return;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }, []);

    // Player를 1회만 생성하고 유지
    useEffect(() => {
      const setupPlayer = () => {
        if (!containerRef.current) return;
        if (playerRef.current) return;

        // React 트리 바깥에서 관리되는 placeholder를 생성하여 YT.Player에 전달
        if (!placeholderRef.current) {
          const placeholder = document.createElement('div');
          placeholder.style.width = '100%';
          placeholder.style.height = '100%';
          try {
            containerRef.current.appendChild(placeholder);
          } catch {}
          placeholderRef.current = placeholder;
        }

        playerRef.current = new window.YT.Player(placeholderRef.current as HTMLDivElement, {
          // 최초 생성 시에는 videoId/playlist 미지정. 이후 effect에서 load 처리
          playerVars: {
            autoplay: 1,
            playsinline: 1,
            rel: 0,
            modestbranding: 1,
            origin: window.location.origin,
            widget_referrer: window.location.origin,
            loop: loopRef.current ? 1 : 0,
            // 백그라운드 재생을 위한 추가 설정
            enablejsapi: 1,
            controls: 1,
            disablekb: 0,
            fs: 1,
            cc_load_policy: 0,
            iv_load_policy: 3,
            autohide: 0,
            showinfo: 0,
            start: 0,
            end: 0,
            // 모바일 최적화
            mobile: 1,
            // 백그라운드 재생 지원
            allowfullscreen: 1,
          },
          events: {
            onReady: () => {
              console.log('YouTube 플레이어 준비 완료');
              // 상위 컴포넌트에 준비 완료 알림
              onPlayerReady?.();
              
              // autoplay 차단 회피: mute → play, 그리고 현재 콘텐츠 로드
              try {
                playerRef.current?.mute?.();
                // 현재 props 기준으로 즉시 곡/플레이리스트 로드
                const ids = playlistIdsRef.current;
                const idx = typeof startIndexRef.current === 'number' ? startIndexRef.current : 0;
                const vid = videoIdRef.current;
                console.log('콘텐츠 로딩 시도:', { ids, idx, vid });
                if (ids && ids.length > 0 && typeof playerRef.current?.loadPlaylist === 'function') {
                  playerRef.current.loadPlaylist(ids, idx, 0);
                } else if (vid && typeof playerRef.current?.loadVideoById === 'function') {
                  playerRef.current.loadVideoById(vid, 0, 'default');
                }
                playerRef.current?.playVideo?.();
              } catch (e) {
                console.log('초기 로딩 실패:', e);
              }
              endedCalledRef.current = false; // 새로운 영상 시작 시 플래그 리셋
              lastCurrentTimeRef.current = 0;
              stuckTimeRef.current = 0;
              if (timerRef.current) window.clearInterval(timerRef.current);
              timerRef.current = window.setInterval(() => {
                if (!playerRef.current) return;
                const ct = typeof playerRef.current.getCurrentTime === 'function' ? playerRef.current.getCurrentTime() : 0;
                const du = typeof playerRef.current.getDuration === 'function' ? playerRef.current.getDuration() : 0;
                const state = typeof playerRef.current.getPlayerState === 'function' ? playerRef.current.getPlayerState() : -1;
                
                if (onTimeUpdateRef.current && Number.isFinite(ct) && Number.isFinite(du) && du > 0) {
                  onTimeUpdateRef.current(ct, du);
                }
                
                if (onPlayStateChangeRef.current && window.YT && window.YT.PlayerState) {
                  onPlayStateChangeRef.current(state === window.YT.PlayerState.PLAYING);
                }
                
                // 백그라운드에서도 ENDED 상태 감지 - 다중 방법 사용
                if (!endedCalledRef.current) {
                  // 방법 1: getPlayerState()로 ENDED 상태 감지
                  if (window.YT && window.YT.PlayerState && state === window.YT.PlayerState.ENDED) {
                    endedCalledRef.current = true;
                    try {
                      if (playlistIds && (playerRef.current as any)?.nextVideo) {
                        (playerRef.current as any).nextVideo();
                      }
                    } catch {}
                    onEndedRef.current?.();
                  }
                  // 방법 2: 시간 기반 감지 (현재 시간이 총 시간에 근접하거나 같을 때)
                  else if (Number.isFinite(ct) && Number.isFinite(du) && du > 0) {
                    const timeDiff = Math.abs(ct - du);
                    if (timeDiff <= 1.0) { // 1초 이내로 끝에 도달했을 때
                      endedCalledRef.current = true;
                      try {
                        if (playlistIds && (playerRef.current as any)?.nextVideo) {
                          (playerRef.current as any).nextVideo();
                        }
                      } catch {}
                      onEndedRef.current?.();
                    }
                    // 방법 3: 시간이 멈춰있는지 감지 (백그라운드에서 시간이 멈출 수 있음)
                    else if (Math.abs(ct - lastCurrentTimeRef.current) < 0.1) {
                      stuckTimeRef.current += 1;
                      // 3초 이상 시간이 멈춰있고, 현재 시간이 총 시간의 95% 이상일 때
                      if (stuckTimeRef.current >= 3 && ct >= du * 0.95) {
                        endedCalledRef.current = true;
                        try {
                          if (playlistIds && (playerRef.current as any)?.nextVideo) {
                            (playerRef.current as any).nextVideo();
                          }
                        } catch {}
                        onEndedRef.current?.();
                      }
                    } else {
                      stuckTimeRef.current = 0;
                    }
                    lastCurrentTimeRef.current = ct;
                  }
                }
                // PLAYING 상태가 되면 음소거 해제 시도 (가능한 환경에서만)
                if (window.YT && window.YT.PlayerState && state === window.YT.PlayerState.PLAYING) {
                  try { playerRef.current?.unMute?.(); } catch {}
                }
              }, 1000);
            },
            onStateChange: (e: any) => {
              if (onPlayStateChangeRef.current && window.YT && window.YT.PlayerState) {
                onPlayStateChangeRef.current(e.data === window.YT.PlayerState.PLAYING);
              }
              if (window.YT && window.YT.PlayerState && e.data === window.YT.PlayerState.ENDED && !endedCalledRef.current) {
                endedCalledRef.current = true;
                onEndedRef.current?.();
              }
            },
            onError: () => {
              // 로딩 실패 시 cue 후 재생 재시도
              try {
                const vid = videoIdRef.current;
                if (vid && typeof playerRef.current?.cueVideoById === 'function') {
                  playerRef.current.cueVideoById(vid, 0, 'default');
                  setTimeout(() => {
                    try { playerRef.current?.playVideo?.(); } catch {}
                  }, 300);
                }
              } catch {}
            },
          },
        });
      };

      if (window.YT && window.YT.Player) {
        setupPlayer();
      } else {
        window.onYouTubeIframeAPIReady = setupPlayer;
      }

      return () => {
        if (timerRef.current) window.clearInterval(timerRef.current);
        timerRef.current = null;
        try { playerRef.current?.destroy?.(); } catch {}
        playerRef.current = null;
        // YT가 교체한 iframe 또는 placeholder를 래퍼에서 안전하게 제거
        try {
          if (containerRef.current && placeholderRef.current && containerRef.current.contains(placeholderRef.current)) {
            containerRef.current.removeChild(placeholderRef.current);
          }
        } catch {}
        placeholderRef.current = null;
      };
    }, []);

    // 비디오/플레이리스트 로딩 (플레이어 유지한 채 교체)
    useEffect(() => {
      if (!playerRef.current || !(window as any).YT) return;
      try {
        endedCalledRef.current = false;
        lastCurrentTimeRef.current = 0;
        stuckTimeRef.current = 0;
        if (playlistIds && playlistIds.length > 0) {
          // loop 적용을 위해 playerVars.loop는 생성 시 설정됨
          if (typeof (playerRef.current as any).loadPlaylist === 'function') {
            (playerRef.current as any).loadPlaylist(playlistIds, typeof startIndex === 'number' ? startIndex : 0, 0);
          }
        } else if (videoId) {
          if (typeof (playerRef.current as any).loadVideoById === 'function') {
            (playerRef.current as any).loadVideoById(videoId, 0, 'default');
          }
        }
      } catch {}
    }, [videoId, JSON.stringify(playlistIds || []), startIndex, loop]);

    // 콜백 함수들을 ref로 저장하여 최신 상태 유지
    const onTimeUpdateRef = useRef(onTimeUpdate);
    const onPlayStateChangeRef = useRef(onPlayStateChange);
    const onEndedRef = useRef(onEnded);

    useEffect(() => {
      onTimeUpdateRef.current = onTimeUpdate;
    }, [onTimeUpdate]);

    useEffect(() => {
      onPlayStateChangeRef.current = onPlayStateChange;
    }, [onPlayStateChange]);

    useEffect(() => {
      onEndedRef.current = onEnded;
    }, [onEnded]);

    useImperativeHandle(ref, () => ({
      play: () => {
        if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
        }
      },
      pause: () => {
        if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
        }
      },
      seek: (time: number) => {
        if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
          // seekTo의 두 번째 파라미터를 false로 설정하여 즉시 이동
          playerRef.current.seekTo(time, false);
        }
      },
    }));

    // React는 래퍼만 관리하고, 내부 실제 플레이어 노드는 동적으로 추가/삭제됨
    return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
  },
);

YouTubeIframePlayer.displayName = 'YouTubeIframePlayer';

export default YouTubeIframePlayer;


