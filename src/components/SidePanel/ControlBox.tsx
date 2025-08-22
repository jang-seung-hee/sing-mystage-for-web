import React from 'react';
import { TrendingUp, Repeat, Heart } from 'lucide-react';

interface ControlBoxProps {
  repeatMode: boolean;
  onRepeatModeChange: (mode: boolean) => void;
  favoritesAutoMode: boolean;
  onFavoritesAutoModeChange: (mode: boolean) => void;
}

const ControlBox: React.FC<ControlBoxProps> = ({ 
  repeatMode, 
  onRepeatModeChange, 
  favoritesAutoMode, 
  onFavoritesAutoModeChange 
}) => {
  // 반복 모드 토글 핸들러 (반복 ON <-> 반복 꺼짐)
  const handleRepeatToggle = () => {
    onRepeatModeChange(!repeatMode);
  };

  // 찜 연속재생 모드 토글 핸들러 (찜 연속재생 <-> 찜 연속꺼짐)
  const handleFavoritesAutoToggle = () => {
    onFavoritesAutoModeChange(!favoritesAutoMode);
  };

  // 인기곡차트 버튼 클릭 핸들러
  const handlePopularChart = () => {
    window.open('https://charts.youtube.com/', '_blank');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 컨트롤 버튼들 */}
      <div className="flex w-full gap-1">
        {/* 1) 반복 */}
        <button
          className={`flex-1 w/full py-0.5 px-2 rounded-md text-sm font-bold transition-all duration-300 flex items-center justify-center gap-0.5 ${
            repeatMode 
              ? 'bg-neon-cyan text-black border border-neon-cyan shadow-neon-cyan'
              : 'bg-transparent border border-gray-500 text-gray-400 hover:border-neon-cyan hover:text-neon-cyan'
          }`}
          onClick={handleRepeatToggle}
        >
          <Repeat size={16} className={repeatMode ? '' : 'opacity-60'} />
          {repeatMode ? '반복 ON' : '반복 꺼짐'}
        </button>
        {/* 2) 찜 연속 */}
        <button
          className={`flex-1 w-full py-0.5 px-2 rounded-md text-sm font-bold transition-all duration-300 flex items-center justify-center gap-0.5 ${
            favoritesAutoMode
              ? 'bg-neon-yellow text-black border border-neon-yellow shadow-neon-yellow'
              : 'bg-transparent border border-gray-500 text-gray-400 hover:border-neon-yellow hover:text-neon-yellow'
          }`}
          onClick={handleFavoritesAutoToggle}
        >
          <Heart size={16} className={favoritesAutoMode ? '' : 'opacity-60'} />
          {favoritesAutoMode ? '찜 연속재생' : '찜 연속꺼짐'}
        </button>
        {/* 3) 인기곡 */}
        <button
          className="flex-1 w-full bg-dark-card border border-neon-pink text-neon-pink py-0.5 px-2 rounded-md text-sm font-bold hover:bg-neon-pink hover:text-black hover:shadow-neon-pink transition-all duration-300 flex items-center justify-center gap-0.5"
          onClick={handlePopularChart}
        >
          <TrendingUp size={16} />
          인기곡차트
        </button>
      </div>
    </div>
  );
};

export default ControlBox;
