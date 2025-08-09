import React from 'react';
import SearchBar from '../Search/SearchBar';

interface SearchBoxProps {
  onSearch: (query: string) => void;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch }) => {
  return (
    <div className="px-0.5 pt-0.5 pb-0 border-b border-dark-border">
      <SearchBar onSearch={onSearch} />
    </div>
  );
};

export default SearchBox;
