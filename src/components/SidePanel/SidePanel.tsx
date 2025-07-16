import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import ProfileBox from './ProfileBox';
import SearchBox from './SearchBox';
import SearchResultBox from './SearchResultBox';
import ControlBox from './ControlBox';
import ListBox from './ListBox';
import { YouTubeSearchResultItem } from '../../types/youtube';

interface SidePanelProps {
  results: any[];
  loading: boolean;
  error: string | null;
  onSearch: (query: string, type?: string) => void;
  onSelect: (item: any, tab: 'recent' | 'favorites') => void;
  isOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  recentUpdateTrigger: number;
  onPlayAll?: (favorites: any[]) => void;
  onPlayRandom?: (favorites: any[]) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({ results, loading, error, onSearch, onSelect, isOpen, setSidebarOpen, recentUpdateTrigger, onPlayAll, onPlayRandom }) => {
  // 모바일 환경 감지
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // 스와이프 핸들러
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && isOpen) setSidebarOpen(false);
    },
    onSwipedRight: () => {
      if (isMobile && !isOpen) setSidebarOpen(true);
    },
    trackTouch: true
  });

  return (
    <>
      {/* 패널이 닫혀있을 때 왼쪽에 투명 스와이프 감지 영역 */}
      {isMobile && !isOpen && (
        <div
          {...swipeHandlers}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: 30,
            height: '100vh',
            zIndex: 30,
            background: 'transparent',
            touchAction: 'pan-y',
          }}
        />
      )}
      <aside
        {...(isMobile ? swipeHandlers : {})}
        className={`
      w-[360px] max-w-full h-full bg-dark-bg border-r border-dark-border flex flex-col 
      transition-transform duration-300 ease-in-out
      fixed lg:relative z-40
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
      >
        <ProfileBox />
        {/* 버튼 그룹을 로고 바로 아래로, 더 아래로 내리고 전체 폭을 채우도록 조정 */}
        <div className="px-2 mt-1 mb-1 w-full">
          <ControlBox />
        </div>
        {/* 버튼과 검색창 사이에 간격 */}
        <div className="h-2" />
        <SearchBox onSearch={onSearch} />
        {/* 고정 높이 영역: 검색결과 */}
        <div style={{maxHeight: 197}} className="flex flex-col">
          <SearchResultBox results={results} loading={loading} error={error} onSelect={(item) => onSelect(item, 'recent')} />
        </div>
        {/* 가변 영역: 리스트 */}
        <div className="flex-1 min-h-0 flex flex-col">
          <ListBox onSelect={onSelect} recentUpdateTrigger={recentUpdateTrigger} onPlayAll={onPlayAll} onPlayRandom={onPlayRandom} />
        </div>
      </aside>
    </>
  );
};

export default SidePanel;
