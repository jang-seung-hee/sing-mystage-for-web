import React from 'react';
import { Settings, TrendingUp } from 'lucide-react';

const ControlBox: React.FC = () => {
  // 노래방차트 버튼 클릭 핸들러
  const handleKaraokeChart = () => {
    window.open('https://kysing.kr/genre-polular/', '_blank');
  };

  // 인기곡차트 버튼 클릭 핸들러  
  const handlePopularChart = () => {
    window.open('https://charts.youtube.com/', '_blank');
  };

  return (
    <div className="p-4 -mt-12 border-b border-dark-border flex flex-col gap-4">
      {/* 컨트롤 버튼들 */}
      <div className="flex gap-2">
        <button 
          className="flex-1 bg-dark-card border border-neon-cyan text-neon-cyan py-2 px-3 rounded text-xs font-bold hover:bg-neon-cyan hover:text-black hover:shadow-neon-cyan transition-all duration-300 flex items-center justify-center gap-1"
          onClick={handleKaraokeChart}
        >
          <TrendingUp size={12} />
          노래방차트
        </button>
        <button 
          className="flex-1 bg-dark-card border border-neon-pink text-neon-pink py-2 px-3 rounded text-xs font-bold hover:bg-neon-pink hover:text-black hover:shadow-neon-pink transition-all duration-300 flex items-center justify-center gap-1"
          onClick={handlePopularChart}
        >
          <TrendingUp size={12} />
          인기곡차트
        </button>
        <button className="flex-1 bg-dark-card border border-neon-yellow text-neon-yellow py-2 px-3 rounded text-xs font-bold hover:bg-neon-yellow hover:text-black hover:shadow-neon-yellow transition-all duration-300 flex items-center justify-center gap-1">
          <Settings size={12} />
          환경설정
        </button>
      </div>
    </div>
  );
};

export default ControlBox;
