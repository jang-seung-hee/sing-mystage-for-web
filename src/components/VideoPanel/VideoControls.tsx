import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Mic,
  Video,
  Heart,
  Settings,
  Shuffle,
  Repeat,
  VolumeOff,
} from 'lucide-react';

interface VideoControlsProps {
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  onPlayPause?: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onSeek,
  onPlayPause,
}) => {
  const isMuted = false; // 음소거 기능은 아직 미구현
  const [volume, setVolume] = useState(70);
  const [isVolumeOpen, setIsVolumeOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  // 진행률 계산 (0-100%)
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    // undefined, null, NaN 처리
    if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
      return '0:00';
    }

    // 0초도 정상적으로 처리
    const totalSeconds = Math.floor(seconds);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 시간 정보가 업데이트될 때 필요한 경우에만 로그 출력
  // (성능상 이유로 일반적인 시간 업데이트 로그는 제거)

  // 현재 시간이 변할 때마다 강제로 컴포넌트 리렌더링 확인
  const displayCurrentTime = formatTime(currentTime);
  const displayDuration = formatTime(duration);

  // 진행 바 클릭 핸들러
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || duration === 0) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const newTime = percentage * duration;

    onSeek(newTime);
  };

  return (
    <div className="h-20 sm:h-24 bg-dark-bg border-t border-dark-border relative overflow-hidden">
      {/* 네온 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow opacity-5"></div>

      {/* 진행바 */}
      <div
        className="absolute top-0 left-0 right-0 h-1 bg-dark-card cursor-pointer"
        onClick={handleProgressClick}
      >
        <div
          className="h-full bg-gradient-to-r from-neon-cyan to-neon-pink shadow-neon-cyan transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
        {/* 프로그레스 핸들 */}
        <div
          className="absolute top-1/2 w-2 h-2 sm:w-3 sm:h-3 bg-neon-cyan rounded-full shadow-neon-cyan transform -translate-y-1/2 transition-all duration-300 hover:scale-110 touch-manipulation pointer-events-none"
          style={{ left: `${progress}%`, marginLeft: '-4px' }}
        ></div>
      </div>

      {/* 모바일 시간 정보 (상단 오버레이) */}
      <div className="sm:hidden absolute top-2 left-1/2 transform -translate-x-1/2 text-xs font-mono">
        <span className="text-neon-cyan">{displayCurrentTime}</span>
        <span className="text-gray-400 mx-1">/</span>
        <span className="text-neon-pink">{displayDuration}</span>
      </div>

      <div className="flex items-center justify-between h-full px-3 sm:px-6 py-2 sm:py-3">
        {/* 왼쪽: 시간 정보 (모바일에서 숨김) */}
        <div className="hidden sm:flex items-center space-x-4 min-w-0 flex-1">
          <div className="text-white font-mono text-sm">
            <span className="text-neon-cyan">{displayCurrentTime}</span>
            <span className="text-gray-400 mx-2">/</span>
            <span className="text-neon-pink">{displayDuration}</span>
          </div>
        </div>

        {/* 중앙: 주요 재생 컨트롤 */}
        <div className="flex items-center space-x-1 sm:space-x-3 flex-1 sm:flex-none justify-center">
          {/* 이전곡 (모바일에서 숨김) */}
          <button className="hidden sm:block p-2 sm:p-3 bg-dark-card border border-neon-blue text-neon-blue rounded-lg hover:bg-neon-blue hover:text-black hover:shadow-neon-blue transition-all duration-300 group touch-manipulation">
            <SkipBack
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform"
            />
          </button>

          {/* 재생/일시정지 */}
          <button
            onClick={() => onPlayPause?.()}
            className="p-3 sm:p-4 bg-neon-cyan text-black rounded-full hover:shadow-neon-cyan hover:scale-105 transition-all duration-300 group touch-manipulation"
          >
            {isPlaying ? (
              <Pause
                size={20}
                className="sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"
              />
            ) : (
              <Play
                size={20}
                className="sm:w-6 sm:h-6 group-hover:scale-110 transition-transform"
              />
            )}
          </button>

          {/* 다음곡 (모바일에서 숨김) */}
          <button className="hidden sm:block p-2 sm:p-3 bg-dark-card border border-neon-blue text-neon-blue rounded-lg hover:bg-neon-blue hover:text-black hover:shadow-neon-blue transition-all duration-300 group touch-manipulation">
            <SkipForward
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform"
            />
          </button>

          {/* 반복 (태블릿 이상에서만 표시) */}
          <button className="hidden md:block p-2 sm:p-3 bg-dark-card border border-neon-green text-neon-green rounded-lg hover:bg-neon-green hover:text-black hover:shadow-neon-green transition-all duration-300 group touch-manipulation">
            <Repeat
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform"
            />
          </button>

          {/* 셔플 (태블릿 이상에서만 표시) */}
          <button className="hidden md:block p-2 sm:p-3 bg-dark-card border border-neon-purple text-neon-purple rounded-lg hover:bg-neon-purple hover:text-black hover:shadow-neon-purple transition-all duration-300 group touch-manipulation">
            <Shuffle
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform"
            />
          </button>
        </div>

        {/* 오른쪽: 볼륨 및 특수 기능 */}
        <div className="flex items-center space-x-1 sm:space-x-3 min-w-0 flex-1 sm:flex-none justify-end">
          {/* 볼륨 컨트롤 */}
          <div className="relative">
            <button
              onClick={() => setIsVolumeOpen(!isVolumeOpen)}
              onMouseEnter={() => setIsVolumeOpen(true)}
              onTouchStart={() => setIsVolumeOpen(true)}
              className="p-2 sm:p-3 bg-dark-card border border-neon-cyan text-neon-cyan rounded-lg hover:bg-neon-cyan hover:text-black hover:shadow-neon-cyan transition-all duration-300 group touch-manipulation"
            >
              {isMuted ? <VolumeOff size={18} /> : <Volume2 size={18} />}
            </button>

            {/* 볼륨 슬라이더 팝업 */}
            {isVolumeOpen && (
              <div
                className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-dark-card border border-neon-cyan rounded-lg p-3 shadow-neon-cyan"
                onMouseLeave={() => setIsVolumeOpen(false)}
              >
                <div className="flex flex-col items-center space-y-2">
                  <div className="text-neon-cyan text-xs font-bold">{volume}%</div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-20 h-2 bg-dark-bg rounded-lg appearance-none cursor-pointer slider-neon-cyan transform rotate-90"
                    style={{ width: '80px', height: '100px' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 마이크 (태블릿 이상에서만 표시) */}
          <button className="hidden md:block p-2 sm:p-3 bg-dark-card border border-neon-pink text-neon-pink rounded-lg hover:bg-neon-pink hover:text-black hover:shadow-neon-pink transition-all duration-300 group touch-manipulation">
            <Mic
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform"
            />
          </button>

          {/* 녹화 */}
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-300 group touch-manipulation ${
              isRecording
                ? 'bg-red-600 text-white shadow-glow-lg animate-pulse'
                : 'bg-dark-card border border-red-400 text-red-400 hover:bg-red-400 hover:text-black hover:shadow-glow-md'
            }`}
          >
            <Video
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform"
            />
          </button>

          {/* 즐겨찾기 */}
          <button
            onClick={() => setIsFavorite(!isFavorite)}
            className={`p-2 sm:p-3 rounded-lg transition-all duration-300 group touch-manipulation ${
              isFavorite
                ? 'bg-neon-yellow text-black shadow-neon-yellow'
                : 'bg-dark-card border border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-black hover:shadow-neon-yellow'
            }`}
          >
            <Heart
              size={16}
              className={`sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform ${isFavorite ? 'fill-current' : ''}`}
            />
          </button>

          {/* 설정 (모바일에서 숨김) */}
          <button className="hidden sm:block p-2 sm:p-3 bg-dark-card border border-gray-400 text-gray-400 rounded-lg hover:bg-gray-400 hover:text-black hover:shadow-glow-sm transition-all duration-300 group touch-manipulation">
            <Settings
              size={16}
              className="sm:w-[18px] sm:h-[18px] group-hover:scale-110 transition-transform group-hover:rotate-90"
            />
          </button>
        </div>
      </div>

      {/* 하단 네온 장식선 */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow opacity-60"></div>
    </div>
  );
};

export default VideoControls;
