import React, { forwardRef, useState, useRef } from 'react';
import Player, { PlayerRef } from '../Player/Player';
import { YouTubeSearchResultItem } from '../../types/youtube';
import { Music } from 'lucide-react';
import { Expand, Minimize } from 'lucide-react';

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
    const [showFullscreenBtn, setShowFullscreenBtn] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const hideBtnTimeout = useRef<NodeJS.Timeout | null>(null);

    // 전체화면 상태 감지
    React.useEffect(() => {
      const handleFullscreenChange = () => {
        const isFs = !!(
          document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement
        );
        setIsFullscreen(isFs);
      };
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.addEventListener('mozfullscreenchange', handleFullscreenChange);
      document.addEventListener('MSFullscreenChange', handleFullscreenChange);
      return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      };
    }, []);

    // orientationchange 시 버튼 자동 표시 (항상 보이도록 수정)
    React.useEffect(() => {
      const handleOrientationChange = () => {
        if (window.screen && window.screen.orientation) {
          const isLandscape = window.screen.orientation.type.startsWith('landscape');
          setShowFullscreenBtn(isLandscape);
        }
      };
      window.addEventListener('orientationchange', handleOrientationChange);
      // 최초 진입 시에도 상태 반영
      handleOrientationChange();
      return () => {
        window.removeEventListener('orientationchange', handleOrientationChange);
      };
    }, []);

    // 터치 시 버튼 표시 (가로 모드에서 항상 보이므로 제거)

    // 전체화면 토글
    const handleFullscreenToggle = () => {
      const container = document.querySelector('.video-container');
      if (!isFullscreen) {
        if (container && (container as any).requestFullscreen) {
          (container as any).requestFullscreen();
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
      <div className="flex-1 flex flex-col p-3 sm:p-6 min-h-0">
        <div className="w-full h-full relative min-h-[400px] sm:min-h-[500px]">
          {/* 네온 테두리 컨테이너 (모바일에서 감소된 효과) */}
          <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-cyan p-0.5 sm:p-1 rounded-lg opacity-60 animate-pulse-glow neon-reduced">
            <div className="w-full h-full bg-dark-bg rounded-lg"></div>
          </div>

          {/* 전체화면 토글 버튼 (모바일 가로, 터치 시 2초간 표시) */}
          {showFullscreenBtn && (
            <button
              className="absolute top-4 right-4 z-30 bg-black/20 rounded-full p-1 border border-neon-cyan shadow-neon-cyan transition-all duration-300"
              style={{ touchAction: 'manipulation', boxShadow: '0 0 8px #00fff7, 0 0 16px #00fff755', backdropFilter: 'blur(2px)' }}
              onClick={handleFullscreenToggle}
            >
              {isFullscreen ? <Minimize size={20} color="#00fff7" style={{ filter: 'drop-shadow(0 0 6px #00fff744)', opacity: 0.7 }} /> : <Expand size={20} color="#00fff7" style={{ filter: 'drop-shadow(0 0 6px #00fff744)', opacity: 0.7 }} />}
            </button>
          )}

          {/* 플레이어 영역 */}
          <div className="relative z-10 w-full h-full video-container">
            <Player
              ref={ref}
              videoId={typeof currentItem.id === 'string' ? currentItem.id : currentItem.id.videoId}
              adFree={adFree}
              streamUrl={streamUrl || null}
              title={currentItem.snippet?.title || ''}
              onTimeUpdate={onTimeUpdate}
              onPlayStateChange={onPlayStateChange}
              onEnded={onEnded}
            />
          </div>
        </div>
      </div>
    );
  },
);

VideoArea.displayName = 'VideoArea';

export default VideoArea;
