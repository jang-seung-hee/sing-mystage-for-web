import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import Alert from '../Common/Alert';
import { YouTubeSearchResultItem } from '../../types/youtube';
import { Play, Music, Heart } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFavorites, addFavorite, removeFavorite } from '../../services/favoritesService';
import FolderSelector from '../Favorites/FolderSelector';

interface SearchResultsProps {
  results: YouTubeSearchResultItem[];
  onSelect: (item: YouTubeSearchResultItem) => void;
  loading: boolean;
  error: string | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, loading, error }) => {
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResultItem | null>(null);
  const { user } = useAuth();

  // 즐겨찾기 ID 세트 로드
  const loadFavoriteIds = useCallback(async () => {
    if (!user) return;
    try {
      const favorites = await getFavorites();
      const ids = new Set(favorites.map(item => {
        const videoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
        return videoId;
      }));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('즐겨찾기 ID 로딩 실패:', error);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFavoriteIds();
    }
  }, [user, loadFavoriteIds]);

  // 찜하기 토글
  const toggleFavorite = async (video: YouTubeSearchResultItem, e: React.MouseEvent) => {
    e.stopPropagation(); // 부모 클릭 이벤트 차단
    if (!user) return;
    
    const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
    const isFavorited = favoriteIds.has(videoId);

    try {
      if (isFavorited) {
        // 즐겨찾기 제거 - 현재 즐겨찾기 목록에서 해당 항목을 찾아서 제거
        const favorites = await getFavorites();
        const favoriteItem = favorites.find(item => {
          const itemVideoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
          return itemVideoId === videoId;
        });
        if (favoriteItem) {
          await removeFavorite(favoriteItem.id);
          // 로컬 상태 즉시 업데이트
          const newFavoriteIds = new Set(favoriteIds);
          newFavoriteIds.delete(videoId);
          setFavoriteIds(newFavoriteIds);
        }
      } else {
        // 즐겨찾기 추가 - 폴더 선택 모달 열기
        setSelectedVideo(video);
        setFolderSelectorOpen(true);
      }
    } catch (error) {
      console.error('즐겨찾기 토글 실패:', error);
    }
  };

  // 폴더 선택 완료 핸들러
  const handleFolderSelect = async (folderId?: string) => {
    if (!selectedVideo) return;

    try {
      await addFavorite(selectedVideo, folderId);
      // 로컬 상태 즉시 업데이트
      const videoId = typeof selectedVideo.id === 'string' ? selectedVideo.id : selectedVideo.id.videoId;
      const newFavoriteIds = new Set(favoriteIds);
      newFavoriteIds.add(videoId);
      setFavoriteIds(newFavoriteIds);
    } catch (error) {
      console.error('즐겨찾기 추가 실패:', error);
    } finally {
      setSelectedVideo(null);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert message={error} type="error" />;
  if (!results.length) {
    return (
      <div className="text-center py-8">
        <Music size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
        <div className="text-gray-400">검색 결과가 없습니다.</div>
        <div className="text-gray-500 text-sm mt-2">다른 키워드로 검색해 보세요</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 검색 결과 리스트 */}
      <div className="space-y-2 max-h-64 sm:max-h-80 overflow-y-auto custom-scrollbar">
        {results.map((item, index) => {
          const videoId = typeof item.id === 'string' ? item.id : item.id.videoId;
          const isFavorited = favoriteIds.has(videoId);

          return (
            <div
              key={`search-${videoId}-${index}`}
              className="group relative bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-neon-cyan hover:shadow-glow-sm transition-all duration-300 cursor-pointer touch-manipulation active:scale-95"
              onClick={() => {
                console.log('영상 클릭:', item.snippet?.title);
                onSelect(item);
              }}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              {/* 네온 호버 효과 */}
              <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-transparent to-neon-pink opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>

              <div className="flex items-center p-1.5 sm:p-2 relative z-10">
                {/* 썸네일 */}
                <div className="relative mr-1.5 sm:mr-2 flex-shrink-0">
                  <div className="w-10 h-7 sm:w-12 sm:h-9 relative rounded-lg overflow-hidden border border-dark-border group-hover:border-neon-cyan transition-colors duration-300">
                    <img
                      src={item.snippet?.thumbnails?.default?.url}
                      alt="thumbnail"
                      className="w-full h-full object-cover"
                    />
                    {/* 재생 오버레이 */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
                      <Play
                        size={10}
                        className="sm:w-3 sm:h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />
                    </div>
                  </div>
                  {/* 네온 프레임 효과 */}
                  <div className="absolute inset-0 rounded-lg border border-neon-cyan opacity-0 group-hover:opacity-60 transition-opacity duration-300 pointer-events-none"></div>
                </div>

                {/* 정보 영역 */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white leading-tight mb-0.5 group-hover:text-neon-cyan transition-colors duration-300 line-clamp-2">
                    {item.snippet?.title}
                  </div>
                  <div className="text-sm text-gray-400 truncate">{item.snippet?.channelTitle}</div>
                </div>

                {/* 찜하기 버튼 */}
                {user && (
                  <button
                    onClick={(e) => toggleFavorite(item, e)}
                    className={`ml-2 p-1.5 rounded-full transition-all duration-300 hover:scale-110 flex-shrink-0 ${
                      isFavorited
                        ? 'text-neon-pink hover:text-pink-300'
                        : 'text-gray-500 hover:text-neon-pink'
                    }`}
                    title={isFavorited ? '찜 제거' : '찜 추가'}
                  >
                    <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
                  </button>
                )}
              </div>

              {/* 하단 네온 장식선 */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
            </div>
          );
        })}
      </div>

      {/* 폴더 선택 모달 */}
      {selectedVideo && (
        <FolderSelector
          isOpen={folderSelectorOpen}
          onClose={() => {
            setFolderSelectorOpen(false);
            setSelectedVideo(null);
          }}
          onSelect={handleFolderSelect}
          video={selectedVideo}
        />
      )}
    </div>
  );
};

export default SearchResults;
