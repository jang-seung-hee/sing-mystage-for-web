import React from 'react';
import LoadingSpinner from '../Common/LoadingSpinner';
import Alert from '../Common/Alert';
import { YouTubeSearchResultItem } from '../../types/youtube';
import { Play, Music } from 'lucide-react';

interface SearchResultsProps {
  results: YouTubeSearchResultItem[];
  onSelect: (item: YouTubeSearchResultItem) => void;
  loading: boolean;
  error: string | null;
}

const SearchResults: React.FC<SearchResultsProps> = ({ results, onSelect, loading, error }) => {
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

          return (
            <div
              key={`search-${videoId}-${index}`}
              className="group relative bg-dark-card border border-dark-border rounded-lg overflow-hidden hover:border-neon-cyan hover:shadow-glow-sm transition-all duration-300 cursor-pointer touch-manipulation active:scale-95"
              onClick={() => onSelect(item)}
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
              </div>

              {/* 하단 네온 장식선 */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-neon-cyan to-transparent opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default SearchResults;
