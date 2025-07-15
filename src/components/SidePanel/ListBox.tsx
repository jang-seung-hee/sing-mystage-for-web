import React, { useState, useEffect } from 'react';
import { Clock, Heart, Trash2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRecents } from '../../services/recentService';
import { getFavorites, addFavorite, removeFavorite } from '../../services/favoritesService';
import LoadingSpinner from '../Common/LoadingSpinner';
import { YouTubeSearchResultItem } from '../../types/youtube';

interface ListItem {
  id: string;
  video: YouTubeSearchResultItem;
  playedAt?: number;
  createdAt?: number;
}

interface ListBoxProps {
  onSelect?: (item: YouTubeSearchResultItem) => void;
  recentUpdateTrigger?: number; // 최근 부른 곡 업데이트 트리거
}

const ListBox: React.FC<ListBoxProps> = ({ onSelect, recentUpdateTrigger }) => {
  const [tab, setTab] = useState<'recent' | 'favorites'>('recent');
  const [recents, setRecents] = useState<ListItem[]>([]);
  const [favorites, setFavorites] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const { user } = useAuth();

  // 3일 = 3 * 24 * 60 * 60 * 1000 ms
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  // 3일 이전 데이터 필터링 함수
  const filterRecentItems = (items: ListItem[]): ListItem[] => {
    const now = Date.now();
    return items.filter(item => {
      const itemDate = item.playedAt || item.createdAt || 0;
      return (now - itemDate) <= THREE_DAYS_MS;
    });
  };

  // 최근 재생 목록 로드
  const loadRecents = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = await getRecents() as ListItem[];
      // 3일 이전 데이터 필터링
      const filteredItems = filterRecentItems(items);
      setRecents(filteredItems);
    } catch (error) {
      console.error('최근 재생 목록 불러오기 실패:', error);
      setRecents([]);
    } finally {
      setLoading(false);
    }
  };

  // 즐겨찾기 목록 로드
  const loadFavorites = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = await getFavorites() as ListItem[];
      setFavorites(items);
      // 즐겨찾기 ID 세트 업데이트
      const ids = new Set(items.map(item => {
        const videoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
        return videoId;
      }));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('즐겨찾기 목록 불러오기 실패:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadRecents();
      loadFavorites();
    }
  }, [user]);

  // recentUpdateTrigger가 변경될 때마다 최근 부른 곡 새로고침
  useEffect(() => {
    if (user && recentUpdateTrigger !== undefined && recentUpdateTrigger > 0) {
      loadRecents();
    }
  }, [recentUpdateTrigger, user]);

  // 찜 토글
  const toggleFavorite = async (video: YouTubeSearchResultItem) => {
    if (!user) return;
    
    const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
    const isFavorited = favoriteIds.has(videoId);

    try {
      if (isFavorited) {
        const favoriteItem = favorites.find(item => {
          const itemVideoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
          return itemVideoId === videoId;
        });
        if (favoriteItem) {
          await removeFavorite(favoriteItem.id);
        }
      } else {
        await addFavorite(video);
      }
      
      // 즉시 업데이트
      await loadFavorites();
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
    }
  };

  // 즐겨찾기 삭제
  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      await removeFavorite(favoriteId);
      await loadFavorites();
    } catch (error) {
      console.error('즐겨찾기 삭제 실패:', error);
    }
  };

  const renderListItem = (item: ListItem, index: number) => {
    const videoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
    const isFavorited = favoriteIds.has(videoId);
    const title = item.video.snippet?.title || '제목 없음';
    const channelTitle = item.video.snippet?.channelTitle || '채널 없음';

    const gradientBg = tab === 'recent' 
      ? 'from-neon-cyan via-transparent to-transparent'
      : 'from-neon-pink via-transparent to-transparent';

    return (
      <div
        key={`${tab}-${videoId}-${index}`}
        className={`group relative min-h-[60px] py-2 px-3 rounded-lg border transition-all duration-300 cursor-pointer
          bg-dark-card border-dark-border flex items-center ${
            tab === 'recent' ? 'hover:border-neon-cyan' : 'hover:border-neon-pink'
          } hover:shadow-glow-sm`}
        style={{ 
          animationDelay: `${index * 50}ms`,
          animation: 'fadeInUp 0.5s ease-out forwards'
        }}
        onClick={() => onSelect && onSelect(item.video)}
      >
        {/* 호버 그라데이션 효과 */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r ${gradientBg} rounded-lg`}></div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
          {/* 제목 */}
          <h4 
            className={`font-medium text-sm transition-colors duration-300 truncate ${
              tab === 'recent' ? 'text-white group-hover:text-neon-cyan' : 'text-white group-hover:text-neon-pink'
            }`}
            title={title}
          >
            {title}
          </h4>
          
          {/* 채널명 */}
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {channelTitle}
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3 z-10">
          {/* 찜 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.video);
            }}
            className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 ${
              isFavorited
                ? 'text-neon-pink hover:text-pink-300'
                : 'text-gray-500 hover:text-neon-pink'
            }`}
            title={isFavorited ? '찜 제거' : '찜 추가'}
          >
            <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>

          {/* 삭제 버튼 (즐겨찾기 탭에서만) */}
          {tab === 'favorites' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(item.id);
              }}
              className="p-1.5 rounded-full transition-all duration-300 hover:scale-110 text-gray-500 hover:text-red-400"
              title="목록에서 제거"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const currentItems = tab === 'recent' ? recents : favorites;

  return (
    <div className="p-3 flex-1 overflow-y-auto flex flex-col">
      {/* 탭 헤더 */}
      <div className="flex gap-0 mb-0 flex-shrink-0">
        <button
          className={`flex-1 py-3 px-4 rounded-t-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-b-0 ${
            tab === 'recent'
              ? 'bg-neon-cyan text-black shadow-neon-cyan border-neon-cyan'
              : 'bg-dark-card text-neon-cyan border-dark-border hover:bg-neon-cyan hover:bg-opacity-10 hover:shadow-glow-sm'
          }`}
          onClick={() => setTab('recent')}
        >
          <Clock size={14} />
          최근 부른 곡
        </button>
        <button
          className={`flex-1 py-3 px-4 rounded-t-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-b-0 ${
            tab === 'favorites'
              ? 'bg-neon-pink text-black shadow-neon-pink border-neon-pink'
              : 'bg-dark-card text-neon-pink border-dark-border hover:bg-neon-pink hover:bg-opacity-10 hover:shadow-glow-sm'
          }`}
          onClick={() => setTab('favorites')}
        >
          <Heart size={14} />
          즐겨찾기
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 border border-dark-border border-t-0 rounded-b-lg overflow-hidden flex flex-col">
        {/* 콘텐츠 리스트 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-1">
              {currentItems.map((item, index) => renderListItem(item, index))}
            </div>
          )}

          {/* 빈 상태 표시 */}
          {!loading && currentItems.length === 0 && (
            <div className="text-center py-8">
              {tab === 'recent' ? (
                <>
                  <Clock size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                  <div className="text-gray-400">최근 부른 곡이 없습니다</div>
                  <div className="text-gray-500 text-sm mt-2">부른 곡이 여기에 자동으로 추가됩니다</div>
                </>
              ) : (
                <>
                  <Heart size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                  <div className="text-gray-400">즐겨찾기가 없습니다</div>
                  <div className="text-gray-500 text-sm mt-2">하트 버튼을 눌러 즐겨찾기를 추가해 보세요</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListBox;