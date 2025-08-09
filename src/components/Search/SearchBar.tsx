import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-4">
      {/* 검색 입력창 */}
      <div className="relative">
        <input
          type="text"
          placeholder="노래 제목, 가수 등 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border text-white p-3 pr-10 rounded-lg focus:border-neon-cyan focus:shadow-glow-md outline-none transition-all duration-300 placeholder-gray-400"
          required
        />
        <Search
          size={18}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        />
      </div>

      {/* 검색 버튼 */}
      <button
        type="submit"
        className="w-full bg-neon-cyan text-black px-4 py-3 rounded-lg font-bold hover:shadow-neon-cyan hover:bg-opacity-90 transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Search size={18} />
        검색
      </button>
    </form>
  );
};

export default SearchBar;
