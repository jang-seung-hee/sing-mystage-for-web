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
    <div className="w-full flex flex-col items-center">
      {/* 컨트롤 버튼들 */}
      <div className="flex w-full gap-1">
        <button 
          className="flex-1 w-full bg-dark-card border border-neon-cyan text-neon-cyan py-0.5 px-2 rounded-md text-sm font-bold hover:bg-neon-cyan hover:text-black hover:shadow-neon-cyan transition-all duration-300 flex items-center justify-center gap-0.5"
          onClick={handleKaraokeChart}
        >
          <TrendingUp size={16} />
          노래방차트
        </button>
        <button 
          className="flex-1 w-full bg-dark-card border border-neon-pink text-neon-pink py-0.5 px-2 rounded-md text-sm font-bold hover:bg-neon-pink hover:text-black hover:shadow-neon-pink transition-all duration-300 flex items-center justify-center gap-0.5"
          onClick={handlePopularChart}
        >
          <TrendingUp size={16} />
          인기곡차트
        </button>
        <button className="flex-1 w-full bg-dark-card border border-neon-yellow text-neon-yellow py-0.5 px-2 rounded-md text-sm font-bold hover:bg-neon-yellow hover:text-black hover:shadow-neon-yellow transition-all duration-300 flex items-center justify-center gap-0.5"
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
