import React, { forwardRef, useRef, useEffect, useState } from 'react';
import Player, { PlayerRef } from '../Player/Player';
import { YouTubeSearchResultItem } from '../../types/youtube';
import { Music } from 'lucide-react';
import { Expand, Minimize } from 'lucide-react';
import ScreenLockToggle from '../Common/ScreenLockToggle';

interface VideoAreaProps {
  selected?: YouTubeSearchResultItem | null;
  streamUrl?: string | null;
  adFree: boolean;
  playlist?: YouTubeSearchResultItem[];
  currentIndex?: number;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
  onEnded?: () => void;
}

const VideoArea = forwardRef<PlayerRef, VideoAreaProps>(
  (
    {
      selected,
      streamUrl,
      adFree,
      playlist,
      currentIndex,
      onTimeUpdate,
      onPlayStateChange,
      onEnded,
    },
    ref,
  ) => {
    // 훅은 항상 컴포넌트 최상단에서 호출
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isScreenLocked, setIsScreenLocked] = useState(false);
    const hideBtnTimeout = useRef<NodeJS.Timeout | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    // 전체화면 상태 감지 및 모바일 대응(useEffect 통합)
    useEffect(() => {
      const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (!isMobile) return;

      const handleOrientationChange = () => {
        setTimeout(() => {
          const isLandscape = window.matchMedia('(orientation: landscape)').matches;
          const container = containerRef.current;
          if (!container) return;

          if (isLandscape) {
            // 가로모드: 전체화면 버튼은 항상 보임 (렌더링 조건에서 처리)
            // 전체화면 자동 진입은 사용자가 버튼을 눌러야 하므로 여기선 자동 진입 X
          } else {
            // 세로모드: 전체화면이면 무조건 종료
            if (document.fullscreenElement) {
              document.exitFullscreen().catch(() => {});
            }
          }
        }, 100);
      };

      const handleFullscreenChange = () => {
        setIsFullscreen(document.fullscreenElement === containerRef.current);
      };

      window.addEventListener('orientationchange', handleOrientationChange);
      window.addEventListener('resize', handleOrientationChange);
      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange);
        window.removeEventListener('resize', handleOrientationChange);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }, []);

    // 전체화면 토글
    const handleFullscreenToggle = () => {
      const container = document.querySelector('.video-container');
      if (!isFullscreen) {
        if (container && (container as any).requestFullscreen) {
          (container as any).requestFullscreen().catch(() => {});
        } else if (container && (container as any).webkitRequestFullscreen) {
          (container as any).webkitRequestFullscreen();
        } else if (container && (container as any).mozRequestFullScreen) {
          (container as any).mozRequestFullScreen();
        } else if (container && (container as any).msRequestFullscreen) {
          (container as any).msRequestFullscreen();
        }
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          (document as any).msExitFullscreen();
        }
      }
    };

    // 재생 상태 변경 핸들러
    const handlePlayStateChange = (playing: boolean) => {
      setIsPlaying(playing);
      if (onPlayStateChange) {
        onPlayStateChange(playing);
      }
    };

    // 화면 잠금 상태 변경 핸들러
    const handleScreenLockChange = (locked: boolean) => {
      setIsScreenLocked(locked);
      
      // 화면 잠금 시 터치 이벤트 차단
      if (locked) {
        // 전체 body 터치 차단
        document.body.style.pointerEvents = 'none';
        document.body.style.userSelect = 'none';
        
        // iframe 내부도 터치 차단 (YouTube UI 포함)
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          iframe.style.pointerEvents = 'none';
          iframe.style.userSelect = 'none';
          iframe.style.touchAction = 'none';
        });
        
        // 비디오 컨테이너만 터치 허용 (재생/일시정지 등 기본 컨트롤)
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
          (videoContainer as HTMLElement).style.pointerEvents = 'auto';
          (videoContainer as HTMLElement).style.userSelect = 'auto';
        }
        
        // 화면 잠금 토글 버튼은 항상 터치 허용
        const lockButton = document.querySelector('[data-screen-lock-toggle]');
        if (lockButton) {
          (lockButton as HTMLElement).style.pointerEvents = 'auto';
          (lockButton as HTMLElement).style.userSelect = 'auto';
        }
        
        // 잠금 토글 버튼의 부모 컨테이너도 터치 허용
        const lockButtonContainer = lockButton?.closest('.fixed');
        if (lockButtonContainer) {
          (lockButtonContainer as HTMLElement).style.pointerEvents = 'auto';
          (lockButtonContainer as HTMLElement).style.userSelect = 'auto';
        }
      } else {
        // 잠금 해제 시 모든 터치 이벤트 복원
        document.body.style.pointerEvents = '';
        document.body.style.userSelect = '';
        
        // iframe 터치 이벤트 복원
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => {
          iframe.style.pointerEvents = '';
          iframe.style.userSelect = '';
          iframe.style.touchAction = '';
        });
        
        // 비디오 컨테이너 스타일 복원
        const videoContainer = document.querySelector('.video-container');
        if (videoContainer) {
          (videoContainer as HTMLElement).style.pointerEvents = '';
          (videoContainer as HTMLElement).style.userSelect = '';
        }
        
        // 화면 잠금 토글 버튼 스타일 복원
        const lockButton = document.querySelector('[data-screen-lock-toggle]');
        if (lockButton) {
          (lockButton as HTMLElement).style.pointerEvents = '';
          (lockButton as HTMLElement).style.userSelect = '';
        }
        
        // 잠금 토글 버튼의 부모 컨테이너 스타일 복원
        const lockButtonContainer = lockButton?.closest('.fixed');
        if (lockButtonContainer) {
          (lockButtonContainer as HTMLElement).style.pointerEvents = '';
          (lockButtonContainer as HTMLElement).style.userSelect = '';
        }
      }
    };

    // Determine current item: playlist > selected
    const currentItem =
      playlist && typeof currentIndex === 'number' && playlist.length > 0
        ? playlist[currentIndex] || null
        : selected || null;

    if (!currentItem) {
      return (
        <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-black via-gray-950 to-black">
          <div className="text-center space-y-6 max-w-md">
            {/* 네온 로고 애니메이션 */}
            <div className="relative">
              <div className="w-24 h-24 mx-auto relative">
                <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow rounded-full animate-spin-slow opacity-20"></div>
                <div className="absolute inset-2 bg-gradient-to-r from-neon-pink via-neon-yellow to-neon-cyan rounded-full animate-spin-reverse opacity-30"></div>
                <div className="absolute inset-4 bg-gradient-to-r from-neon-yellow via-neon-cyan to-neon-pink rounded-full animate-pulse opacity-40"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Music size={32} className="text-neon-cyan animate-pulse-glow" />
                </div>
              </div>
            </div>

            {/* 메시지 */}
            <div className="space-y-3">
              <h3 className="text-xl font-bold text-white">
                <span className="bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow bg-clip-text text-transparent">
                  Neon Music for Web
                </span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                검색에서 곡을 선택하면
                <br />
                여기에 뮤직비디오가 재생됩니다
              </p>
            </div>

            {/* 장식적 요소 */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-neon-pink rounded-full animate-bounce"
                style={{ animationDelay: '0.1s' }}
              ></div>
              <div
                className="w-2 h-2 bg-neon-yellow rounded-full animate-bounce"
                style={{ animationDelay: '0.2s' }}
              ></div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        className={
          isFullscreen
            ? 'flex-1 flex flex-col min-h-0'
            : 'flex-1 flex flex-col p-3 sm:p-6 min-h-0'
        }
        style={isFullscreen ? { padding: 0, margin: 0 } : undefined}
      >
        <div
          ref={containerRef}
          className={
            isFullscreen
              ? 'fixed top-0 left-0 z-[9999] bg-black flex items-center justify-center'
              : 'w-full h-full relative min-h-[400px] sm:min-h-[500px]'
          }
          style={
            isFullscreen
              ? { width: '100vw', height: '100vh', minHeight: 0, padding: 0, margin: 0 }
              : undefined
          }
        >
          {/* 네온 테두리 컨테이너 (전체화면에서는 네온만 꺼짐, ㄱ자 배경은 짙은 회색) */}
          {!isFullscreen ? (
            <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-cyan p-0.5 sm:p-1 rounded-lg opacity-60 animate-pulse-glow neon-reduced">
              <div className="w-full h-full bg-dark-bg rounded-lg"></div>
            </div>
          ) : (
            <div className="absolute inset-0 p-0.5 sm:p-1 rounded-lg pointer-events-none">
              <div className="w-full h-full bg-gray-900/70 opacity-40 rounded-lg"></div>
            </div>
          )}

          {/* 전체화면 토글 버튼 (모바일 가로모드에서만 표시) */}
          {(() => {
            const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            const isLandscape = isMobile && window.matchMedia('(orientation: landscape)').matches;
            if (!isMobile || !isLandscape) return null;
            return (
              <button
                className="absolute top-4 right-4 z-30 bg-black/20 rounded-full p-1 border border-neon-cyan shadow-neon-cyan transition-all duration-300"
                style={{ touchAction: 'manipulation', boxShadow: '0 0 8px #00fff7, 0 0 16px #00fff755', backdropFilter: 'blur(2px)' }}
                onClick={handleFullscreenToggle}
              >
                {isFullscreen ? <Minimize size={20} color="#00fff7" style={{ filter: 'drop-shadow(0 0 6px #00fff744)', opacity: 0.7 }} /> : <Expand size={20} color="#00fff7" style={{ filter: 'drop-shadow(0 0 6px #00fff744)', opacity: 0.7 }} />}
              </button>
            );
          })()}

          {/* 플레이어 영역 */}
          <div className="relative z-10 w-full h-full video-container">
            <Player
              ref={ref}
              videoId={typeof currentItem.id === 'string' ? currentItem.id : currentItem.id.videoId}
              adFree={adFree}
              streamUrl={streamUrl || null}
              title={currentItem.snippet?.title || ''}
              onTimeUpdate={onTimeUpdate}
              onPlayStateChange={handlePlayStateChange}
              onEnded={onEnded}
            />
            
            {/* 화면 잠금 시 iframe 위에 투명 오버레이 */}
            {isScreenLocked && !adFree && (
              <div
                ref={overlayRef}
                className="absolute inset-0 z-20 bg-transparent"
                style={{ 
                  pointerEvents: 'auto',
                  touchAction: 'none'
                }}
              />
            )}
          </div>
        </div>

        {/* 화면 잠금 토글 버튼 */}
        <ScreenLockToggle
          isPlaying={isPlaying}
          onLockChange={handleScreenLockChange}
          isLocked={isScreenLocked}
        />
      </div>
    );
  },
);

VideoArea.displayName = 'VideoArea';

export default VideoArea;
