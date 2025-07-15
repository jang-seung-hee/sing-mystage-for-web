import React, { useState, Suspense, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { searchYouTube, getAdFreeStreamUrl } from '../services/youtubeApi';
import { addRecent } from '../services/recentService';
import { YouTubeSearchResultItem } from '../types/youtube';
import { useAuth } from '../hooks/useAuth';
import AuthForm from '../components/Auth/AuthForm';
import LoadingSpinner from '../components/Common/LoadingSpinner';
const SidePanel = React.lazy(() => import('../components/SidePanel/SidePanel'));
const VideoPanel = React.lazy(() => import('../components/VideoPanel/VideoPanel'));

const MainPage: React.FC = () => {
  // 모든 hooks를 최상단에 배치
  const { user, loading: authLoading } = useAuth();
  
  // 사이드바 토글 상태 (데스크톱: 기본 열림, 모바일: 기본 닫힘)
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  // 검색/선택/영상 상태 관리
  const [results, setResults] = useState<YouTubeSearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<YouTubeSearchResultItem | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [adFree, setAdFree] = useState(false);
  const [recentUpdateTrigger, setRecentUpdateTrigger] = useState(0); // 최근 부른 곡 업데이트 트리거

  // 창 크기 변경 시 사이드바 상태 조정
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true); // 데스크톱에서는 항상 열림
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 조건부 렌더링 처리
  // 로딩 중이면 로딩 스피너 표시
  if (authLoading) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // 로그인되지 않은 경우 AuthForm 표시
  if (!user) {
    return (
      <div className="min-h-screen bg-dark-bg flex items-center justify-center">
        <div className="w-full max-w-md p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">SingMyStage</h1>
            <p className="text-gray-400">개인화된 노래방 서비스를 이용하시려면 로그인하세요</p>
          </div>
          <AuthForm />
        </div>
      </div>
    );
  }

  // 사이드바 토글 함수
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 오버레이 클릭 시 사이드바 닫기 (모바일)
  const closeSidebarOnOverlay = () => {
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // 실제 검색 기능 구현
  const handleSearch = async (query: string, type = 'video') => {
    setLoading(true);
    setError(null);
    setResults([]);
    
    // 검색어 조합 로직
    let searchQuery = query.trim();
    if (type !== 'all') {
      // 일반검색이 아닌 경우 타입에 따른 키워드 추가
      const typeKeywords = {
        'video': '노래방',
        'music': '원곡',
        'cover': '커버곡'
      };
      const typeKeyword = typeKeywords[type as keyof typeof typeKeywords];
      if (typeKeyword) {
        searchQuery = `${query.trim()} ${typeKeyword}`;
      }
    }
    
    try {
      const res = await searchYouTube(searchQuery);
      setResults(res);
    } catch (e: any) {
      setError(e.message || '검색 실패');
    } finally {
      setLoading(false);
    }
  };

  // 선택 시 영상 재생 및 최근곡 추가
  const handleSelect = async (item: YouTubeSearchResultItem) => {
    setSelected(item);
    setStreamUrl(null);
    setAdFree(false);
    
    try {
      // 최근 부른 곡에 추가 (로그인 필수)
      if (user) {
        await addRecent(item);
        // 최근 부른 곡 목록 업데이트 트리거
        setRecentUpdateTrigger(prev => prev + 1);
      }
      
      const url = await getAdFreeStreamUrl(typeof item.id === 'string' ? item.id : item.id.videoId);
      setStreamUrl(url);
      setAdFree(true);
    } catch (error) {
      console.error('스트림 URL 가져오기 실패:', error);
      setStreamUrl(
        `https://www.youtube.com/embed/${typeof item.id === 'string' ? item.id : item.id.videoId}`,
      );
      setAdFree(false);
    }
  };

  const videoUrl =
    selected &&
    `https://www.youtube.com/embed/${typeof selected.id === 'string' ? selected.id : selected.id.videoId}`;

  return (
    <div className="flex h-screen bg-gradient-karaoke relative">
      {/* 햄버거 메뉴 버튼 */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-3 bg-dark-card hover:bg-gray-700 text-white rounded-lg shadow-neon-cyan transition-all duration-300 hover:shadow-glow-md lg:hidden touch-manipulation active:scale-95"
        aria-label="메뉴 토글"
      >
        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* 모바일 오버레이 */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden transition-opacity duration-300 touch-manipulation"
          onClick={closeSidebarOnOverlay}
          onTouchStart={closeSidebarOnOverlay}
        />
      )}

      <Suspense fallback={<div>로딩 중...</div>}>
        <SidePanel
          results={results}
          loading={loading}
          error={error}
          onSearch={handleSearch}
          onSelect={handleSelect}
          isOpen={sidebarOpen}
          recentUpdateTrigger={recentUpdateTrigger}
        />
        <div className="flex-1 flex flex-col">
          <VideoPanel
            selected={selected}
            streamUrl={streamUrl}
            adFree={adFree}
            loading={loading}
            error={error}
          />
        </div>
      </Suspense>
    </div>
  );
};

export default MainPage;
