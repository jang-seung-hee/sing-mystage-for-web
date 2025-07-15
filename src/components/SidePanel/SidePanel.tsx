import React from 'react';
import ProfileBox from './ProfileBox';
import SearchBox from './SearchBox';
import SearchResultBox from './SearchResultBox';
import ControlBox from './ControlBox';
import ListBox from './ListBox';
import { YouTubeSearchResultItem } from '../../types/youtube';

interface SidePanelProps {
  results: YouTubeSearchResultItem[];
  loading: boolean;
  error: string | null;
  onSearch: (query: string, type: string) => void;
  onSelect: (item: YouTubeSearchResultItem) => void;
  isOpen: boolean;
  recentUpdateTrigger?: number; // 최근 부른 곡 업데이트 트리거
}

const SidePanel: React.FC<SidePanelProps> = ({
  results,
  loading,
  error,
  onSearch,
  onSelect,
  isOpen,
  recentUpdateTrigger,
}) => {
  return (
    <aside
      className={`
      w-[360px] max-w-full h-full bg-dark-bg border-r border-dark-border shadow-neon-cyan flex flex-col 
      transition-transform duration-300 ease-in-out
      fixed lg:relative z-40
      ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}
    >
      <ProfileBox />
      <SearchBox onSearch={onSearch} />
      <SearchResultBox results={results} loading={loading} error={error} onSelect={onSelect} />
      <ControlBox />
      <ListBox onSelect={onSelect} recentUpdateTrigger={recentUpdateTrigger} />
    </aside>
  );
};

export default SidePanel;
