import React, { useState, useEffect, useCallback } from 'react';
import { Search, Download, Star, Eye, User, Calendar, Tag, ArrowLeft, Plus } from 'lucide-react';
import {
  searchSharedFolders,
  downloadSharedFolder,
  SharedFolder,
  getPopularTags,
} from '../../services/sharedFavoritesService';
import { addFavorite } from '../../services/favoritesService';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../Common/LoadingSpinner';

interface SharedFavoritesListProps {
  onClose: () => void;
}

const SharedFavoritesList: React.FC<SharedFavoritesListProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'rating'>('latest');
  const [loading, setLoading] = useState(false);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<SharedFolder | null>(null);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const { user } = useAuth();

  // 공유 폴더 검색
  const searchFolders = useCallback(async () => {
    setLoading(true);
    try {
      const results = await searchSharedFolders(searchQuery, sortBy, 20);
      setSharedFolders(results);
    } catch (error) {
      console.error('검색 실패:', error);
      setSharedFolders([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, sortBy]);

  // 인기 태그 로드
  const loadPopularTags = useCallback(async () => {
    try {
      const tags = await getPopularTags(10);
      setPopularTags(tags);
    } catch (error) {
      console.error('인기 태그 로딩 실패:', error);
    }
  }, []);

  // 폴더 가져오기
  const handleDownload = async (folder: SharedFolder) => {
    if (!user) return;

    setDownloading(folder.id);
    try {
      // 다운로드 카운트 증가
      await downloadSharedFolder(folder.id);

      // 각 즐겨찾기를 사용자의 기본 폴더에 추가
      let successCount = 0;
      for (const favorite of folder.favorites) {
        try {
          await addFavorite(favorite.video); // 기본 폴더에 추가
          successCount++;
        } catch (error) {
          console.error('즐겨찾기 추가 실패:', favorite.video.snippet?.title, error);
        }
      }

      alert(`"${folder.title}" 폴더에서 ${successCount}개의 즐겨찾기를 가져왔습니다.`);

      // 다운로드 카운트 업데이트를 위해 목록 새로고침
      await searchFolders();
    } catch (error) {
      console.error('폴더 가져오기 실패:', error);
      alert('폴더 가져오기에 실패했습니다.');
    } finally {
      setDownloading(null);
    }
  };

  // 태그 클릭시 검색
  const handleTagClick = (tag: string) => {
    setSearchQuery(tag);
  };

  // 초기 로드
  useEffect(() => {
    searchFolders();
    loadPopularTags();
  }, [searchFolders, loadPopularTags]);

  // 검색 조건 변경시 재검색
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchFolders();
    }, 300); // 디바운스

    return () => clearTimeout(timeoutId);
  }, [searchQuery, sortBy, searchFolders]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR');
  };

  const renderStars = (rating: number, ratingCount: number) => {
    const avgRating = ratingCount > 0 ? rating / ratingCount : 0;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={12}
          className={i <= avgRating ? 'text-yellow-400 fill-current' : 'text-gray-400'}
        />,
      );
    }

    return (
      <div className="flex items-center gap-1">
        <div className="flex">{stars}</div>
        <span className="text-xs text-gray-400">
          ({avgRating.toFixed(1)}) {ratingCount}
        </span>
      </div>
    );
  };

  if (selectedFolder) {
    // 상세보기 화면
    return (
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedFolder(null)}
              className="p-1 text-neon-yellow hover:text-yellow-300 transition-colors duration-300"
              title="뒤로가기"
            >
              <ArrowLeft size={20} />
            </button>
            <h3 className="text-neon-yellow font-bold text-lg">{selectedFolder.title}</h3>
          </div>

          <button
            onClick={() => handleDownload(selectedFolder)}
            disabled={downloading === selectedFolder.id}
            className="flex items-center gap-1 px-3 py-1.5 bg-neon-yellow text-black rounded-lg hover:bg-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
          >
            {downloading === selectedFolder.id ? <LoadingSpinner /> : <Download size={14} />}
            가져오기
          </button>
        </div>

        {/* 폴더 정보 */}
        <div className="bg-dark-bg rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <div className="flex items-center gap-1">
              <User size={14} />
              {selectedFolder.authorName}
            </div>
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              {formatDate(selectedFolder.createdAt)}
            </div>
            <div className="flex items-center gap-1">
              <Download size={14} />
              {selectedFolder.downloadCount}회 다운로드
            </div>
          </div>

          {selectedFolder.description && (
            <p className="text-white text-sm">{selectedFolder.description}</p>
          )}

          {selectedFolder.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedFolder.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-neon-yellow bg-opacity-20 text-neon-yellow rounded text-xs"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {renderStars(selectedFolder.rating, selectedFolder.ratingCount)}
        </div>

        {/* 즐겨찾기 목록 */}
        <div className="space-y-2">
          <h4 className="text-white font-medium">
            즐겨찾기 목록 ({selectedFolder.favoriteCount}개)
          </h4>
          <div className="space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
            {selectedFolder.favorites.map((favorite, index) => (
              <div
                key={`${favorite.id}-${index}`}
                className="bg-dark-bg border border-dark-border rounded-lg px-3 py-2 hover:border-neon-yellow transition-all duration-300 flex items-center gap-3"
              >
                <div className="w-12 h-8 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={favorite.video.snippet?.thumbnails?.default?.url}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-sm truncate">
                    {favorite.video.snippet?.title || '제목 없음'}
                  </div>
                  <div className="text-gray-400 text-xs truncate">
                    {favorite.video.snippet?.channelTitle || '채널 없음'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 목록 화면
  return (
    <div className="space-y-4">
      {/* 검색 헤더 */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="폴더 제목, 설명, 태그, 작성자로 검색..."
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-neon-yellow text-white rounded-lg focus:border-yellow-300 focus:shadow-glow-md outline-none transition-all duration-300 placeholder-gray-400 text-sm"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'latest' | 'popular' | 'rating')}
            className="bg-dark-bg border border-neon-yellow text-white px-3 py-2 rounded-lg focus:border-yellow-300 outline-none text-sm"
          >
            <option value="latest">최신순</option>
            <option value="popular">다운로드순</option>
            <option value="rating">평점순</option>
          </select>
        </div>

        {/* 인기 태그 */}
        {popularTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            <span className="text-xs text-gray-400 mr-2">인기 태그:</span>
            {popularTags.map((tag) => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className="px-2 py-1 bg-gray-700 hover:bg-neon-yellow hover:text-black text-gray-300 rounded text-xs transition-all duration-300"
              >
                #{tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 공유 폴더 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
          {sharedFolders.length > 0 ? (
            sharedFolders.map((folder) => (
              <div
                key={folder.id}
                className="group bg-dark-bg border border-dark-border rounded-lg p-3 hover:border-neon-yellow transition-all duration-300 cursor-pointer"
                onClick={() => setSelectedFolder(folder)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-white font-medium text-sm group-hover:text-neon-yellow transition-colors duration-300">
                    {folder.title}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Download size={12} />
                      {folder.downloadCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye size={12} />
                      {folder.favoriteCount}
                    </span>
                  </div>
                </div>

                {folder.description && (
                  <p className="text-gray-400 text-xs mb-2 line-clamp-2">{folder.description}</p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <User size={12} />
                      {folder.authorName}
                    </span>
                    <span>{formatDate(folder.createdAt)}</span>
                  </div>

                  {renderStars(folder.rating, folder.ratingCount)}
                </div>

                {folder.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {folder.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-1.5 py-0.5 bg-neon-yellow bg-opacity-20 text-neon-yellow rounded text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {folder.tags.length > 3 && (
                      <span className="text-xs text-gray-400">+{folder.tags.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <Search size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
              <div className="text-gray-400">
                {searchQuery ? '검색 결과가 없습니다' : '공유된 폴더가 없습니다'}
              </div>
              <div className="text-gray-500 text-sm mt-2">
                {searchQuery ? '다른 키워드로 검색해보세요' : '첫 번째 폴더를 공유해보세요'}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SharedFavoritesList;
