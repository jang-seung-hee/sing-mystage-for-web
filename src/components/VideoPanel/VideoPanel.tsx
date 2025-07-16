import React, { useState, useRef } from 'react';
import VideoArea from './VideoArea';
// import VideoControls from './VideoControls';
import { PlayerRef } from '../Player/Player';
import { YouTubeSearchResultItem } from '../../types/youtube';

interface VideoPanelProps {
  selected: YouTubeSearchResultItem | null;
  streamUrl: string | null;
  adFree: boolean;
  loading: boolean;
  error: string | null;
}

const VideoPanel: React.FC<VideoPanelProps> = ({ selected, streamUrl, adFree, loading, error }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playerRef = useRef<PlayerRef>(null);

  // 비디오 시간 업데이트 핸들러
  const handleTimeUpdate = (time: number, totalDuration: number) => {
    setCurrentTime(time);
    setDuration(totalDuration);
  };

  // 재생 상태 변경 핸들러
  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
  };

  // 시간 이동 핸들러
  const handleSeek = (time: number) => {
    if (playerRef.current) {
      playerRef.current.seek(time);
    }
  };

  // 재생/일시정지 핸들러
  const handlePlayPause = () => {
    if (playerRef.current) {
      playerRef.current.toggle();
    }
  };

  return (
    <section className="flex-1 flex flex-col h-full min-h-0 bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      {/* 파티클/네온 효과 제거 또는 최소화 */}
      {/* <div className="absolute inset-0 opacity-0 pointer-events-none"></div> */}
      {/* <div className="absolute inset-0 bg-gradient-neon opacity-0 pointer-events-none"></div> */}

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan mx-auto mb-2"></div>
            <p className="text-neon-cyan">로딩 중...</p>
          </div>
        </div>
      )}
      
      {/* 에러 상태 */}
      {error && !loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-neon-pink text-lg">⚠️ 오류 발생</p>
            <p className="text-red-300 text-sm mt-2">{error}</p>
          </div>
        </div>
      )}

      {/* 정상 상태: 비디오 영역만 표시 (컨트롤 패널 제거) */}
      {!loading && !error && (
        <VideoArea 
          ref={playerRef}
          selected={selected} 
          streamUrl={streamUrl} 
          adFree={adFree}
          onTimeUpdate={handleTimeUpdate}
          onPlayStateChange={handlePlayStateChange}
        />
      )}
    </section>
  );
};

export default VideoPanel;
