import React, { useState } from 'react';
import SearchBar from './SearchBar';
import SearchResults from './SearchResults';
import { searchYouTube, getAdFreeStreamUrl } from '../../services/youtubeApi';
import Player from '../Player/Player';
import { addRecent } from '../../services/recentService';

const SearchContainer: React.FC = () => {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<any | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [adFree, setAdFree] = useState(false);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setError(null);
    setResults([]);
    setSelected(null);
    setStreamUrl(null);
    setAdFree(false);

    try {
      const items = await searchYouTube(query.trim(), 50);
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
      
      // youtube.js 사용 중지 (일시적)
      // const url = await getAdFreeStreamUrl(item.id.videoId || item.id);
      // setStreamUrl(url);
      // setAdFree(true);
      
      // 바로 iframe으로 설정 (에러 없이)
      setStreamUrl(`https://www.youtube.com/embed/${item.id.videoId || item.id}`);
      setAdFree(false);
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
