import React from 'react';
import SearchBar from '../Search/SearchBar';

interface SearchBoxProps {
  onSearch: (query: string, type: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  return (
    <div className="px-1 pt-1 pb-0 border-b border-dark-border">
      <SearchBar onSearch={onSearch} />
    </div>
  );
};

export default SearchBox;
