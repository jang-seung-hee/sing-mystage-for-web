import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Menu, X, ChevronRight, ChevronLeft } from 'lucide-react';
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

  // 사이드바 토글 상태 (모바일: 기본 열림, 데스크톱: 기본 열림)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isToggleButtonRef = useRef(false);

  // 검색/선택/영상 상태 관리
  const [results, setResults] = useState<YouTubeSearchResultItem[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<YouTubeSearchResultItem | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [adFree, setAdFree] = useState(false);
  const [recentUpdateTrigger, setRecentUpdateTrigger] = useState(0); // 최근 부른 곡 업데이트 트리거
  // 플레이리스트 및 현재 인덱스 상태 추가
  const [playlist, setPlaylist] = useState<YouTubeSearchResultItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  // 창 크기 변경 시 사이드바 상태 조정 (SidePanel에서 통합 관리)

  // 뒤로가기 버튼 클릭 모니터링 상태 (배포 시 주석 처리)
  // const [backButtonClicked, setBackButtonClicked] = useState(false);
  // const [popStateEvent, setPopStateEvent] = useState('');

  // 모바일 뒤로가기 버튼으로 사이드 패널 열기/닫기 제어
  useEffect(() => {
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    const handlePopState = (e: PopStateEvent) => {
      // 뒤로가기 버튼 클릭 모니터링 (배포 시 주석 처리)
      // setBackButtonClicked(true);
      // setPopStateEvent('popstate 이벤트 발생!');
      
      // 3초 후 모니터링 상태 초기화 (배포 시 주석 처리)
      // setTimeout(() => {
      //   setBackButtonClicked(false);
      //   setPopStateEvent('');
      // }, 3000);

      // 토글 버튼으로 인한 상태 변경인 경우 무시
      if (isToggleButtonRef.current) {
        // setPopStateEvent('토글 버튼으로 인한 변경 - 무시');
        isToggleButtonRef.current = false;
        return;
      }

      // 실시간으로 현재 사이드바 상태 확인
      const currentSidebarOpen = document.querySelector('aside')?.classList.contains('translate-x-0') || false;
      
      if (!currentSidebarOpen) {
        // setPopStateEvent('패널이 닫혀있음 - 열기');
        // 패널이 닫혀있으면 열기
        setSidebarOpen(true);
        // 뒤로가기로 패널을 열었음을 표시하는 플래그 설정
        isToggleButtonRef.current = true;
        // 플래그를 100ms 후에 리셋
        setTimeout(() => {
          isToggleButtonRef.current = false;
        }, 100);
        // 다음 뒤로가기를 위해 history state 추가
        setTimeout(() => {
          window.history.pushState(null, '', window.location.href);
        }, 100);
      } else {
        // setPopStateEvent('패널이 열려있음 - 질문');
        // 패널이 열려있으면 질문하고 닫기
        
        // 즉시 history state를 복원하여 앱 종료 방지
        window.history.pushState(null, '', window.location.href);
        
        // 약간의 지연 후 확인 다이얼로그 표시
        setTimeout(() => {
          const shouldExit = window.confirm('앱을 종료하시겠습니까?');
          if (shouldExit) {
            // setPopStateEvent('사용자 확인 - 앱 종료');
            // 사용자가 확인을 누르면 앱 종료
            window.history.back();
          } else {
            // setPopStateEvent('사용자 취소 - 상태 유지');
            // 사용자가 취소를 누르면 현재 상태 유지 (이미 history state가 복원됨)
          }
        }, 50);
      }
    };

    // 뒤로가기 버튼이 작동하도록 history state 추가
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // 의존성 배열을 빈 배열로 변경

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
    isToggleButtonRef.current = true;
    setSidebarOpen(!sidebarOpen);
    // 상태 변경 후 토글 플래그 초기화
    setTimeout(() => {
      isToggleButtonRef.current = false;
    }, 100);
  };

  // 오버레이 클릭 시 사이드바 닫기 (모바일)
  const closeSidebarOnOverlay = () => {
    if (window.innerWidth < 1024) {
      isToggleButtonRef.current = true;
      setSidebarOpen(false);
      // 상태 변경 후 토글 플래그 초기화
      setTimeout(() => {
        isToggleButtonRef.current = false;
      }, 100);
    }
  };

  // recordUsage API 호출 함수
  async function recordUsage({ type, userId, videoId, title, date, seconds }: {
    type: 'video_play' | 'search' | 'usage_time',
    userId: string,
    videoId?: string,
    title?: string,
    date: string,
    seconds?: number,
  }) {
    try {
      await fetch('https://asia-northeast3-' + process.env.REACT_APP_FIREBASE_PROJECT_ID + '.cloudfunctions.net/recordUsage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, userId, videoId, title, date, seconds }),
      });
    } catch (e) {
      // 집계 실패는 무시 (용량 최적화 목적)
      console.log('recordUsage 실패 (무시됨):', e);
    }
  }

  // 실제 검색 기능 구현
  const handleSearch = async (query: string, type = 'video') => {
    setSearchLoading(true);
    setError(null);
    setResults([]);

    // 검색어 조합 로직
    let searchQuery = query.trim();
    if (type !== 'all') {
      // 일반검색이 아닌 경우 타입에 따른 키워드 추가
      const typeKeywords = {
        video: '노래방',
        music: '원곡',
        cover: '커버곡',
      };
      const typeKeyword = typeKeywords[type as keyof typeof typeKeywords];
      if (typeKeyword) {
        searchQuery = `${query.trim()} ${typeKeyword}`;
      }
    }

    // 검색 집계 호출
    if (user?.uid) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
      recordUsage({ type: 'search', userId: user.uid, date: dateStr });
    }

    try {
      const res = await searchYouTube(searchQuery);
      setResults(res);
    } catch (e: any) {
      setError(e.message || '검색 실패');
    } finally {
      setSearchLoading(false);
    }
  };

  // 선택 시 영상 즉시 재생 및 최근곡 추가
  const handleSelect = async (item: any, tab: 'recent' | 'favorites') => {
    setSelected(item);
    setStreamUrl(null);
    setAdFree(false);
    if (window.innerWidth < 1024) {
      isToggleButtonRef.current = true;
      setSidebarOpen(false);
      // 상태 변경 후 토글 플래그 초기화
      setTimeout(() => {
        isToggleButtonRef.current = false;
      }, 100);
    }
    try {
      // 최근본 영상 탭에서만 addRecent 및 트리거
      if (user && tab === 'recent') {
        await addRecent(item);
        setRecentUpdateTrigger((prev) => prev + 1);
      }
      
      // youtube.js 사용 중지 (일시적)
      // const url = await getAdFreeStreamUrl(typeof item.id === 'string' ? item.id : item.id.videoId);
      // setStreamUrl(url);
      // setAdFree(true);
      
      // 바로 iframe으로 설정 (에러 없이)
      setStreamUrl(
        `https://www.youtube.com/embed/${typeof item.id === 'string' ? item.id : item.id.videoId}?autoplay=1&start=0&rel=0&modestbranding=1&enablejsapi=1`,
      );
      setAdFree(false);
    } catch (error) {
      console.error('스트림 URL 가져오기 실패:', error);
      setStreamUrl(
        `https://www.youtube.com/embed/${typeof item.id === 'string' ? item.id : item.id.videoId}?autoplay=1&start=0&rel=0&modestbranding=1&enablejsapi=1`,
      );
      setAdFree(false);
    }

    // 영상 플레이 집계 호출
    if (user?.uid) {
      const today = new Date();
      const dateStr = today.toISOString().slice(0, 10); // YYYY-MM-DD
      const videoId = typeof item.id === 'string' ? item.id : item.id.videoId;
      const title = item.snippet?.title || '';
      recordUsage({ type: 'video_play', userId: user.uid, videoId, title, date: dateStr });
      // 누적 재생 시간 집계를 위해 userId, date를 localStorage에 저장
      localStorage.setItem('usage_userId', user.uid);
      localStorage.setItem('usage_date', dateStr);
    }
  };

  // 전체 재생 핸들러
  const handlePlayAll = (favorites: YouTubeSearchResultItem[]) => {
    setPlaylist(favorites);
    setCurrentIndex(0);
  };

  // 랜덤 재생 핸들러
  const handlePlayRandom = (favorites: YouTubeSearchResultItem[]) => {
    if (favorites.length === 0) return;
    const randomIdx = Math.floor(Math.random() * favorites.length);
    setPlaylist(favorites);
    setCurrentIndex(randomIdx);
  };

  return (
    <div className="flex h-screen bg-gradient-karaoke relative">
      {/* 실시간 상태 디버깅 (배포 시 주석 처리) */}
      {/* <div className="fixed top-4 left-4 z-50 bg-black bg-opacity-80 text-white p-2 rounded text-xs">
        <div>sidebarOpen: {sidebarOpen.toString()}</div>
        <div>isToggleButton: {isToggleButtonRef.current.toString()}</div>
        <div>DOM 상태: {document.querySelector('aside')?.classList.contains('translate-x-0')?.toString() || 'unknown'}</div>
        <div className="mt-2 border-t border-white pt-1">
          <div className="font-bold">뒤로가기 모니터링:</div>
          <div className={backButtonClicked ? 'text-yellow-400' : 'text-gray-400'}>
            {backButtonClicked ? '뒤로가기 버튼 클릭됨!' : '뒤로가기 버튼 대기 중...'}
          </div>
          <div className="text-xs text-blue-300">{popStateEvent}</div>
        </div>
      </div> */}
      {/* 햄버거 메뉴 버튼 */}
      {(() => {
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const isPortrait = isMobile && window.matchMedia('(orientation: portrait)').matches;
        if (!isMobile || !isPortrait) return null;
        return (
          <button
            onClick={toggleSidebar}
            className="fixed bottom-4 right-4 p-1.5 bg-dark-card hover:bg-gray-700 text-white rounded-lg shadow-neon-cyan transition-all duration-300 hover:shadow-glow-md lg:hidden touch-manipulation active:scale-95 flex items-center justify-center"
            aria-label="메뉴 토글"
            style={{ minWidth: 29, minHeight: 29, zIndex: 9999 }}
          >
            <span className={`relative flex items-center justify-center`}>
              {sidebarOpen ? (
                <>
                  <ChevronLeft size={17} className="drop-shadow-[0_0_6px_#00fff7] animate-glow-left" />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-l from-neon-cyan/60 to-transparent blur-md animate-glow-left" />
                </>
              ) : (
                <>
                  <ChevronRight size={17} className="drop-shadow-[0_0_6px_#ff00ea] animate-glow-right" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-gradient-to-r from-neon-pink/60 to-transparent blur-md animate-glow-right" />
                </>
              )}
            </span>
          </button>
        );
      })()}

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
          loading={searchLoading}
          error={error}
          onSearch={handleSearch}
          onSelect={handleSelect as (item: any, tab: 'recent' | 'favorites') => void}
          isOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          recentUpdateTrigger={recentUpdateTrigger}
        />
        <div className="flex-1 flex flex-col">
          <VideoPanel
            selected={selected}
            streamUrl={streamUrl}
            adFree={adFree}
            loading={false}
            error={error}
            playlist={playlist}
            currentIndex={currentIndex}
            onEnded={() => {
              if (currentIndex < playlist.length - 1) {
                setCurrentIndex(currentIndex + 1);
              }
            }}
          />
        </div>
      </Suspense>
    </div>
  );
};

export default MainPage;
