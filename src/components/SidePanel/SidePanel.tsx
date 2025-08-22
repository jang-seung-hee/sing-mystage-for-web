import React, { useEffect, useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import ProfileBox from './ProfileBox';
import SearchBox from './SearchBox';
import SearchResultBox from './SearchResultBox';
import ControlBox from './ControlBox';
import ListBox from './ListBox';
import ResizeHandler from '../Common/ResizeHandler';
import VerticalResizeHandler from '../Common/VerticalResizeHandler';
import { getSidebarWidth, saveSidebarWidth, getSearchAreaHeight, saveSearchAreaHeight } from '../../services/layoutSettingsService';


interface SidePanelProps {
  results: any[];
  loading: boolean;
  error: string | null;
  onSearch: (query: string) => void;
  onSelect: (item: any, tab: 'recent' | 'favorites', ctx?: { playlist: any[]; index: number }) => void;
  isOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  recentUpdateTrigger: number;
  onPlayAll?: (favorites: any[]) => void;
  onPlayRandom?: (favorites: any[]) => void;
  repeatMode: boolean;
  onRepeatModeChange: (mode: boolean) => void;
  favoritesAutoMode: boolean;
  onFavoritesAutoModeChange: (mode: boolean) => void;
}

const SidePanel: React.FC<SidePanelProps> = ({
  results,
  loading,
  error,
  onSearch,
  onSelect,
  isOpen,
  setSidebarOpen,
  recentUpdateTrigger,
  onPlayAll,
  onPlayRandom,
  repeatMode,
  onRepeatModeChange,
  favoritesAutoMode,
  onFavoritesAutoModeChange,
}) => {
  // 모바일 환경 감지 및 사이드바 상태 통합 관리
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(360);
  const [searchAreaHeight, setSearchAreaHeight] = useState(197);
  useEffect(() => {
    let rafId = 0;
    const handleResize = () => {
      const isMobileDevice = window.innerWidth < 1024;
      setIsMobile(isMobileDevice);
      // 데스크톱에서는 사이드바를 항상 열린 상태로 유지
      if (!isMobileDevice) {
        setSidebarOpen(true);
      }
    };
    const onResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(handleResize);
    };
    handleResize(); // 초기 실행
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('resize', onResize);
    };
  }, [setSidebarOpen]);

  // 저장된 사이드바 너비 불러오기
  useEffect(() => {
    if (!isMobile) {
      const savedWidth = getSidebarWidth();
      setSidebarWidth(savedWidth);
    }
  }, [isMobile]);

  // 저장된 검색 영역 높이 불러오기
  useEffect(() => {
    const savedHeight = getSearchAreaHeight();
    setSearchAreaHeight(savedHeight);
  }, []);

  // 스와이프 핸들러
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile && isOpen) setSidebarOpen(false);
    },
    onSwipedRight: () => {
      if (isMobile && !isOpen) setSidebarOpen(true);
    },
    trackTouch: true,
  });

  // 리사이즈 핸들러
  const handleResize = (newWidth: number) => {
    setSidebarWidth(newWidth);
    saveSidebarWidth(newWidth);
  };

  // 검색 영역 높이 리사이즈 핸들러
  const handleSearchAreaResize = (newHeight: number) => {
    setSearchAreaHeight(newHeight);
    saveSearchAreaHeight(newHeight);
  };

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
      h-full bg-dark-bg border-r border-dark-border flex flex-col 
      transition-transform duration-300 ease-in-out
      fixed lg:relative z-40
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
        style={{ 
          width: isMobile ? '100vw' : `${sidebarWidth}px`,
          maxWidth: isMobile ? '100vw' : '600px',
          minWidth: isMobile ? '100vw' : '280px'
        }}
      >
        <ProfileBox />
        {/* 버튼 그룹을 로고 바로 아래로, 더 아래로 내리고 전체 폭을 채우도록 조정 */}
        <div className="px-2 mt-1 mb-1 w-full">
          <ControlBox 
            repeatMode={repeatMode} 
            onRepeatModeChange={onRepeatModeChange}
            favoritesAutoMode={favoritesAutoMode}
            onFavoritesAutoModeChange={onFavoritesAutoModeChange}
          />
        </div>
        {/* 버튼과 검색창 사이에 간격 */}
        <div className="h-2" />
        <SearchBox onSearch={onSearch} />
        {/* 검색결과 영역 */}
        <div style={{ height: searchAreaHeight }} className="flex flex-col">
          <SearchResultBox
            results={results}
            loading={loading}
            error={error}
            onSelect={(item) => onSelect(item, 'recent')}
          />
        </div>
        
        {/* 수직 리사이즈 핸들러 */}
        <VerticalResizeHandler
          onResize={handleSearchAreaResize}
          minHeight={150}
          maxHeight={400}
          initialHeight={197}
          currentHeight={searchAreaHeight}
        />
        
        {/* 가변 영역: 리스트 */}
        <div className="flex-1 min-h-0 flex flex-col">
          <ListBox
            onSelect={onSelect}
            recentUpdateTrigger={recentUpdateTrigger}
            onPlayAll={onPlayAll}
            onPlayRandom={onPlayRandom}
          />
        </div>

        {/* 리사이즈 핸들러 (데스크톱에서만 표시) */}
        {!isMobile && (
          <ResizeHandler
            onResize={handleResize}
            minWidth={280}
            maxWidth={600}
            initialWidth={360}
            currentWidth={sidebarWidth}
          />
        )}
      </aside>
    </>
  );
};

export default SidePanel;
