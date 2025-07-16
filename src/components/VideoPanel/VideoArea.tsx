import React, { forwardRef } from 'react';
import Player, { PlayerRef } from '../Player/Player';
import { YouTubeSearchResultItem } from '../../types/youtube';
import { Music } from 'lucide-react';

interface VideoAreaProps {
  selected: YouTubeSearchResultItem | null;
  streamUrl: string | null;
  adFree: boolean;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const VideoArea = forwardRef<PlayerRef, VideoAreaProps>(({ 
  selected, 
  streamUrl, 
  adFree, 
  onTimeUpdate,
  onPlayStateChange 
}, ref) => {
  if (!selected) {
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
                SingMystage for Web
              </span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              검색에서 곡을 선택하면<br />
              여기에 뮤직비디오가 재생됩니다
            </p>
          </div>

          {/* 장식적 요소 */}
          <div className="flex justify-center space-x-2">
            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-neon-pink rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-neon-yellow rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
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

        {/* 플레이어 영역 */}
        <div className="relative z-10 w-full h-full">
          <Player
            ref={ref}
            videoId={typeof selected.id === 'string' ? selected.id : selected.id.videoId}
            adFree={adFree}
            streamUrl={streamUrl}
            title={selected.snippet?.title || ''}
            onTimeUpdate={onTimeUpdate}
            onPlayStateChange={onPlayStateChange}
          />
        </div>
      </div>
    </div>
  );
});

VideoArea.displayName = 'VideoArea';

export default VideoArea;
