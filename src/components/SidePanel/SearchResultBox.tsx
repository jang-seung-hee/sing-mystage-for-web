import React from 'react';
import SearchResults from '../Search/SearchResults';
import { YouTubeSearchResultItem } from '../../types/youtube';

interface SearchResultBoxProps {
  results: YouTubeSearchResultItem[];
  loading: boolean;
  error: string | null;
  onSelect: (item: YouTubeSearchResultItem) => void;
}

const SearchResultBox: React.FC<SearchResultBoxProps> = ({ results, loading, error, onSelect }) => {
  return (
    <div className="px-4 pt-4 pb-0 border-b border-dark-border flex-1 overflow-hidden">
      <SearchResults results={results} loading={loading} error={error} onSelect={onSelect} />
    </div>
  );
};

export default SearchResultBox;
