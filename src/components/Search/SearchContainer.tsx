import React, { useState } from 'react';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import { searchYouTube, searchKaraoke, getAdFreeStreamUrl } from '../../services/youtubeApi';
import Player from '../Player/Player';
import { addRecent } from '../../services/recentService';

const SearchContainer: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [adFree, setAdFree] = useState(false);

  const handleSearch = async (query: string, type: string) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(null);
    setStreamUrl(null);
    setAdFree(false);
    
    try {
      let items;
      
      if (type === 'video') {
        // 노래방 검색: yt-search 기반 (Firebase Functions)
        // TJ노래방, 금영노래방 등 제한된 영상도 검색 가능
        items = await searchKaraoke(`${query.trim()} 노래방`, 10);
      } else {
        // 일반 검색: YouTube Data API 사용
        let searchQuery = query.trim();
        if (type !== 'all') {
          // 일반검색이 아닌 경우 타입에 따른 키워드 추가
          const typeKeywords = {
            'music': '원곡',
            'cover': '커버곡'
          };
          const typeKeyword = typeKeywords[type as keyof typeof typeKeywords];
          if (typeKeyword) {
            searchQuery = `${query.trim()} ${typeKeyword}`;
          }
        }
        items = await searchYouTube(searchQuery);
      }
      
      setResults(items);
    } catch (err: any) {
      setError(err.message || '검색 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (item: any) => {
    setSelected(item);
    setStreamUrl(null);
    setAdFree(false);
    try {
      await addRecent(item);
      const url = await getAdFreeStreamUrl(item.id.videoId || item.id);
      setStreamUrl(url);
      setAdFree(true);
    } catch (err) {
      setStreamUrl(`https://www.youtube.com/embed/${item.id.videoId || item.id}`);
      setAdFree(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-8">
      <SearchBar onSearch={handleSearch} />
      <SearchResults results={results} onSelect={handleSelect} loading={loading} error={error} />
      {/* Player 렌더링 부분 삭제: 검색 시 영상이 멈추지 않도록 함 */}
    </div>
  );
};

export default SearchContainer;
