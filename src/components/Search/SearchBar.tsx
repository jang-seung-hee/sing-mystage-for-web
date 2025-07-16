import React, { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, type: string) => void;
}

const SEARCH_TYPES = [
  { value: 'all', label: '일반검색' },
  { value: 'video', label: '노래방' },
];

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, type);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedType = e.target.value;
    if (selectedType === 'video') {
      alert('준비중인 기능입니다');
      setType('all');
    } else {
      setType(selectedType);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mb-4">
      {/* 첫 번째 줄: 검색 입력창 + 드롭다운 */}
      <div className="flex gap-2">
        {/* 검색 입력창 */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="노래 제목, 가수 등 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-dark-bg border border-dark-border text-white p-2 pr-8 rounded-lg focus:border-neon-cyan focus:shadow-glow-md outline-none transition-all duration-300 placeholder-gray-400"
            required
          />
                  <Search
          size={16}
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        </div>

        {/* 검색 타입 선택 드롭다운 */}
        <select
          value={type}
          onChange={handleTypeChange}
          className="bg-dark-bg border border-dark-border text-white p-2 rounded-lg focus:border-neon-pink focus:shadow-glow-md outline-none transition-all duration-300 cursor-pointer min-w-[90px]"
        >
          {SEARCH_TYPES.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-dark-bg text-white">
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* 두 번째 줄: 검색 버튼 (전체 너비) */}
      <button
        type="submit"
        className="w-full bg-neon-cyan text-black px-4 py-2 rounded-lg font-bold hover:shadow-neon-cyan hover:bg-opacity-90 transition-all duration-300 flex items-center justify-center gap-2"
      >
        <Search size={16} />
        검색
      </button>
    </form>
  );
};

export default SearchBar;
