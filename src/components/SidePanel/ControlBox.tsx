import React, { useState } from 'react';
import { Settings, TrendingUp, Repeat } from 'lucide-react';

interface ControlBoxProps {
  repeatMode: boolean;
  onRepeatModeChange: (mode: boolean) => void;
}

const ControlBox: React.FC<ControlBoxProps> = ({ repeatMode, onRepeatModeChange }) => {
  // 반복 모드 토글 핸들러
  const handleRepeatToggle = () => {
    onRepeatModeChange(!repeatMode);
  };

  // 인기곡차트 버튼 클릭 핸들러
  const handlePopularChart = () => {
    window.open('https://charts.youtube.com/', '_blank');
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* 컨트롤 버튼들 */}
      <div className="flex w-full gap-1">
        <button
          className={`flex-1 w-full py-0.5 px-2 rounded-md text-sm font-bold transition-all duration-300 flex items-center justify-center gap-0.5 ${
            repeatMode 
              ? 'bg-neon-cyan text-black border border-neon-cyan shadow-neon-cyan'
              : 'bg-transparent border border-gray-500 text-gray-400 hover:border-neon-cyan hover:text-neon-cyan'
          }`}
          onClick={handleRepeatToggle}
        >
          <Repeat size={16} className={repeatMode ? '' : 'opacity-60'} />
          {repeatMode ? '반복 ON' : '반복 꺼짐'}
        </button>
        <button
          className="flex-1 w-full bg-dark-card border border-neon-pink text-neon-pink py-0.5 px-2 rounded-md text-sm font-bold hover:bg-neon-pink hover:text-black hover:shadow-neon-pink transition-all duration-300 flex items-center justify-center gap-0.5"
          onClick={handlePopularChart}
        >
          <TrendingUp size={16} />
          인기곡차트
        </button>
        <button
          className="flex-1 w-full bg-dark-card border border-neon-yellow text-neon-yellow py-0.5 px-2 rounded-md text-sm font-bold hover:bg-neon-yellow hover:text-black hover:shadow-neon-yellow transition-all duration-300 flex items-center justify-center gap-0.5"
          onClick={() => alert('준비중인 기능입니다')}
        >
          <Settings size={16} />
          환경설정
        </button>
      </div>
    </div>
  );
};

export default ControlBox;
