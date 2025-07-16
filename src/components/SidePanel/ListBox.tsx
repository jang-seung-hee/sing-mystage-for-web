import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Heart, Trash2, ArrowLeft, Folder, Plus, Check, X, Share2, Download, Loader2 } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getRecents } from '../../services/recentService';
import { getFavorites, getFavoritesByFolder, addFavorite, removeFavorite } from '../../services/favoritesService';
import { shareFolder } from '../../services/sharedFavoritesService';
import { getFolders, addFolder, FolderItem, importOnlineFolder, deleteFolder } from '../../services/foldersService';
import { searchSharedFolders, SharedFolder } from '../../services/sharedFavoritesService';
import LoadingSpinner from '../Common/LoadingSpinner';
import { YouTubeSearchResultItem } from '../../types/youtube';

import FolderSelector from '../Favorites/FolderSelector';

interface ListItem {
  id: string;
  video: YouTubeSearchResultItem;
  playedAt?: number;
  createdAt?: number;
}

interface ListBoxProps {
  onSelect?: (item: YouTubeSearchResultItem) => void;
  recentUpdateTrigger?: number; // 최근 부른 곡 업데이트 트리거
}

const ListBox: React.FC<ListBoxProps> = ({ onSelect, recentUpdateTrigger }) => {
  const [tab, setTab] = useState<'recent' | 'favorites'>('recent');
  const [recents, setRecents] = useState<ListItem[]>([]);
  const [favorites, setFavorites] = useState<ListItem[]>([]);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [folderSelectorOpen, setFolderSelectorOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<YouTubeSearchResultItem | null>(null);
  const [isAddingList, setIsAddingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [addListError, setAddListError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareTitle, setShareTitle] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [showOnlineModal, setShowOnlineModal] = useState(false);
  const [onlineLoading, setOnlineLoading] = useState(false);
  const [sharedFolders, setSharedFolders] = useState<SharedFolder[]>([]);
  const [selectedOnlineFolder, setSelectedOnlineFolder] = useState<SharedFolder | null>(null);
  const [importLoading, setImportLoading] = useState<string | null>(null);
  const { user } = useAuth();

  // 3일 = 3 * 24 * 60 * 60 * 1000 ms
  const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

  // 3일 이전 데이터 필터링 함수
  const filterRecentItems = useCallback((items: ListItem[]): ListItem[] => {
    const now = Date.now();
    return items.filter(item => {
      const itemDate = item.playedAt || item.createdAt || 0;
      return (now - itemDate) <= THREE_DAYS_MS;
    });
  }, [THREE_DAYS_MS]);

  // 최근 재생 목록 로드
  const loadRecents = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const items = await getRecents() as ListItem[];
      // 3일 이전 데이터 필터링
      const filteredItems = filterRecentItems(items);
      setRecents(filteredItems);
    } catch (error) {
      console.error('최근 재생 목록 불러오기 실패:', error);
      setRecents([]);
    } finally {
      setLoading(false);
    }
  }, [user, filterRecentItems]);

  // 찜 목록 로드
  const loadFolders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const folderList = await getFolders();
      setFolders(folderList);
    } catch (error) {
      console.error('찜 목록 불러오기 실패:', error);
      setFolders([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // 전체 찜 영상 ID 로드 (하트 아이콘 표시용)
  const loadFavoriteIds = useCallback(async () => {
    if (!user) return;
    try {
      const allFavorites = await getFavorites() as ListItem[];
      const ids = new Set(allFavorites.map(item => {
        const videoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
        return videoId;
      }));
      setFavoriteIds(ids);
    } catch (error) {
      console.error('찜 영상 ID 불러오기 실패:', error);
    }
  }, [user]);

  // 찜 영상 목록 로드 (전체 또는 특정 폴더)
  const loadFavorites = useCallback(async (folderId?: string) => {
    if (!user) return;
    setLoading(true);
    try {
      let items: ListItem[];
      
      if (!folderId) {
        // 전체 찜 영상
        items = await getFavorites() as ListItem[];
      } else {
        // 특정 폴더의 찜 영상
        const isDefaultFolder = folderId === 'default';
        const actualFolderId = isDefaultFolder ? undefined : folderId;
        items = await getFavoritesByFolder(actualFolderId) as ListItem[];
      }
      
      setFavorites(items);
    } catch (error) {
      console.error('찜 영상 목록 불러오기 실패:', error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadRecents();
      loadFavoriteIds(); // 하트 아이콘 표시를 위한 찜 영상 ID 로드
      if (tab === 'favorites' && !selectedFolderId) {
        loadFolders();
      }
    }
    // 탭 변경시 추가 모드 리셋
    if (tab === 'recent') {
      setIsAddingList(false);
      setNewListName('');
      setAddListError(null);
    }
  }, [user, loadRecents, loadFavoriteIds, loadFolders, tab, selectedFolderId]);

  // recentUpdateTrigger가 변경될 때마다 최근 부른 곡 새로고침
  useEffect(() => {
    if (user && recentUpdateTrigger !== undefined && recentUpdateTrigger > 0) {
      loadRecents();
    }
  }, [recentUpdateTrigger, user, loadRecents]);

  // 찜 토글 - 폴더 선택 기능 추가
  const toggleFavorite = async (video: YouTubeSearchResultItem) => {
    if (!user) return;
    
    const videoId = typeof video.id === 'string' ? video.id : video.id.videoId;
    const isFavorited = favoriteIds.has(videoId);

    try {
      if (isFavorited) {
        // 찜 영상 제거
        const favoriteItem = favorites.find(item => {
          const itemVideoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
          return itemVideoId === videoId;
        });
        if (favoriteItem) {
          await removeFavorite(favoriteItem.id);
          
          // favoriteIds 상태 즉시 업데이트
          const newFavoriteIds = new Set(favoriteIds);
          newFavoriteIds.delete(videoId);
          setFavoriteIds(newFavoriteIds);
        }
        // 찜 목록 화면이면 목록도 업데이트
        if (selectedFolderId) {
          await loadFavorites(selectedFolderId);
        } else if (tab === 'favorites') {
          await loadFolders();
        }
      } else {
        // 찜 영상 추가 - 폴더 선택 모달 열기
        setSelectedVideo(video);
        setFolderSelectorOpen(true);
      }
    } catch (error) {
      console.error('찜 영상 토글 실패:', error);
    }
  };

  // 폴더 선택 완료 핸들러
  const handleFolderSelect = async (folderId?: string) => {
    if (!selectedVideo) return;

    try {
      await addFavorite(selectedVideo, folderId);
      
      // favoriteIds 상태 즉시 업데이트
      const videoId = typeof selectedVideo.id === 'string' ? selectedVideo.id : selectedVideo.id.videoId;
      const newFavoriteIds = new Set(favoriteIds);
      newFavoriteIds.add(videoId);
      setFavoriteIds(newFavoriteIds);
      
      // 찜 목록 화면이면 목록도 업데이트
      if (selectedFolderId) {
        await loadFavorites(selectedFolderId);
      } else if (tab === 'favorites') {
        await loadFolders();
      }
    } catch (error) {
      console.error('찜 영상 추가 실패:', error);
    } finally {
      setSelectedVideo(null);
    }
  };

  // 찜 영상 삭제
  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      // 삭제할 찜 영상의 videoId 찾기
      const favoriteItem = favorites.find(item => item.id === favoriteId);
      
      await removeFavorite(favoriteId);
      
      // favoriteIds 상태 즉시 업데이트
      if (favoriteItem) {
        const videoId = typeof favoriteItem.video.id === 'string' ? favoriteItem.video.id : favoriteItem.video.id.videoId;
        const newFavoriteIds = new Set(favoriteIds);
        newFavoriteIds.delete(videoId);
        setFavoriteIds(newFavoriteIds);
      }
      
      // 찜 목록 화면 업데이트
      if (selectedFolderId) {
        await loadFavorites(selectedFolderId);
      } else {
        await loadFolders();
      }
    } catch (error) {
      console.error('찜 영상 삭제 실패:', error);
    }
  };

  // 찜 목록 클릭 핸들러
  const handleFolderClick = async (folderId: string) => {
    setSelectedFolderId(folderId);
    await loadFavorites(folderId);
  };

  // 뒤로가기 핸들러
  const handleBackToFolders = () => {
    setSelectedFolderId(null);
    setFavorites([]);
    setIsAddingList(false);
    setNewListName('');
    setAddListError(null);
    loadFolders();
  };

  // 찜 목록 추가 핸들러
  const handleAddList = async () => {
    if (!newListName.trim()) return;
    
    setLoading(true);
    setAddListError(null);
    try {
      await addFolder(newListName.trim());
      setNewListName('');
      setIsAddingList(false);
      await loadFolders(); // 목록 새로고침
    } catch (err: any) {
      setAddListError(err.message || '찜 목록 추가 실패');
    } finally {
      setLoading(false);
    }
  };

  // 찜 목록 추가 취소
  const handleCancelAddList = () => {
    setIsAddingList(false);
    setNewListName('');
    setAddListError(null);
  };

  // 온라인 공유 핸들러
  const handleShareClick = () => {
    setShowShareModal(true);
  };

  const handleShareSubmit = async () => {
    if (!shareTitle.trim()) {
      alert('제목을 입력해주세요.');
      return;
    }

    setShareLoading(true);
    try {
      // ListItem을 FavoriteItem 형태로 변환 (undefined 값 제거)
      const favoritesToShare = favorites.map(item => {
        const favoriteData: any = {
          id: item.id,
          uid: user?.uid || '',
          video: item.video,
          createdAt: item.createdAt || Date.now()
        };
        
        // undefined 값 제거
        Object.keys(favoriteData).forEach(key => {
          if (favoriteData[key] === undefined) {
            delete favoriteData[key];
          }
        });
        
        return favoriteData;
      });

      await shareFolder(
        shareTitle.trim(),
        '', // 설명은 빈 문자열
        [], // 태그는 빈 배열
        favoritesToShare
      );
      
      alert(`"${shareTitle}" 찜 목록이 성공적으로 공유되었습니다!`);
      
      // 초기화
      setShareTitle('');
      setShowShareModal(false);
    } catch (err: any) {
      alert(err.message || '공유에 실패했습니다.');
    } finally {
      setShareLoading(false);
    }
  };

  const handleShareCancel = () => {
    setShareTitle('');
    setShowShareModal(false);
  };

  // 온라인 찜목록 가져오기 핸들러
  const handleOnlineImportClick = async () => {
    setShowOnlineModal(true);
    setOnlineLoading(true);
    try {
      const results = await searchSharedFolders('', 'latest', 20);
      setSharedFolders(results);
    } catch (error) {
      console.error('공유 폴더 로딩 실패:', error);
      setSharedFolders([]);
    } finally {
      setOnlineLoading(false);
    }
  };

  const handleOnlineModalClose = () => {
    setShowOnlineModal(false);
    setSelectedOnlineFolder(null);
    setSharedFolders([]);
  };

  const handleOnlineFolderClick = (folder: SharedFolder) => {
    setSelectedOnlineFolder(folder);
  };

  const handleBackToOnlineList = () => {
    setSelectedOnlineFolder(null);
  };

  const handleImportFolder = async (folder: SharedFolder) => {
    setImportLoading(folder.id);
    try {
      await importOnlineFolder(folder);
      alert(`"${folder.title}" 폴더를 성공적으로 가져왔습니다!`);
      
      // 폴더 목록 새로고침
      await loadFolders();
      
      // 모달 닫기
      handleOnlineModalClose();
    } catch (error: any) {
      alert(error.message || '폴더 가져오기에 실패했습니다.');
    } finally {
      setImportLoading(null);
    }
  };

  const handleRemoveFolder = async (folderId: string, folderName: string, isFromOnline?: boolean) => {
    if (folderName === '기본 폴더' || isFromOnline) {
      alert('기본 폴더와 온라인 폴더는 삭제할 수 없습니다.');
      return;
    }
    if (!window.confirm(`'${folderName}' 폴더를 삭제하시겠습니까?\n폴더 내 즐겨찾기는 기본 폴더로 이동됩니다.`)) return;
    setLoading(true);
    try {
      // 폴더 삭제
      const { deleteFolder } = await import('../../services/foldersService');
      await deleteFolder(folderId);
      await loadFolders();
      alert('폴더가 삭제되었습니다.');
    } catch (error: any) {
      alert(error.message || '폴더 삭제에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderListItem = (item: ListItem, index: number) => {
    const videoId = typeof item.video.id === 'string' ? item.video.id : item.video.id.videoId;
    const isFavorited = favoriteIds.has(videoId);
    const title = item.video.snippet?.title || '제목 없음';
    const channelTitle = item.video.snippet?.channelTitle || '채널 없음';

    const gradientBg = tab === 'recent' 
      ? 'from-neon-cyan via-transparent to-transparent'
      : 'from-neon-pink via-transparent to-transparent';

    return (
      <div
        key={`${tab}-${videoId}-${index}`}
        className={`group relative min-h-[60px] py-2 px-3 rounded-lg border transition-all duration-300 cursor-pointer
          bg-dark-card border-dark-border flex items-center ${
            tab === 'recent' ? 'hover:border-neon-cyan' : 'hover:border-neon-pink'
          }`}
        style={{ 
          animationDelay: `${index * 50}ms`,
          animation: 'fadeInUp 0.5s ease-out forwards'
        }}
        onClick={() => onSelect && onSelect(item.video)}
      >
        {/* 호버 그라데이션 효과 */}
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-r ${gradientBg} rounded-lg`}></div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 flex flex-col justify-center min-w-0 z-10">
          {/* 제목 */}
          <h4 
            className={`font-medium text-sm transition-colors duration-300 truncate ${
              tab === 'recent' ? 'text-white group-hover:text-neon-cyan' : 'text-white group-hover:text-neon-pink'
            }`}
            title={title}
          >
            {title}
          </h4>
          
          {/* 채널명 */}
          <p className="text-xs text-gray-400 mt-0.5 truncate">
            {channelTitle}
          </p>
        </div>

        {/* 버튼 영역 */}
        <div className="flex items-center gap-2 flex-shrink-0 ml-3 z-10">
          {/* 찜 버튼 */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(item.video);
            }}
            className={`p-1.5 rounded-full transition-all duration-300 hover:scale-110 ${
              isFavorited
                ? 'text-neon-pink hover:text-pink-300'
                : 'text-gray-500 hover:text-neon-pink'
            }`}
            title={isFavorited ? '찜 제거' : '찜 추가'}
          >
            <Heart size={14} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>

          {/* 삭제 버튼 (즐겨찾기 탭에서만) */}
          {tab === 'favorites' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemoveFavorite(item.id);
              }}
              className="p-1.5 rounded-full transition-all duration-300 hover:scale-110 text-gray-500 hover:text-red-400"
              title="목록에서 제거"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderFolderItem = (folder: FolderItem, index: number) => {
    const isOnlineFolder = folder.isFromOnline;
    const folderColor = isOnlineFolder ? 'neon-pink' : 'neon-cyan';
    const isDefaultFolder = folder.name === '기본 폴더';
    return (
      <button
        key={`folder-${folder.id}-${index}`}
        onClick={() => handleFolderClick(folder.id)}
        className={`flex items-center justify-between w-full py-2 px-3 rounded-lg border transition-all duration-300 cursor-pointer
          ${selectedFolderId === folder.id 
            ? `bg-${folderColor} text-black border-${folderColor}` 
            : `bg-dark-card text-${folderColor} border-dark-border hover:bg-${folderColor} hover:bg-opacity-5`}`}
      >
        <div className="flex items-center min-w-0">
          <Folder size={16} className={`mr-2 text-${folderColor}`} />
          <span className="font-medium text-sm truncate">{folder.name}</span>
          {isOnlineFolder && (
            <span className="ml-2 text-xs px-1.5 py-0.5 bg-neon-pink bg-opacity-20 text-neon-pink rounded">
              온라인
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3 z-10">
          <span className="text-xs text-gray-400">{folder.count}개</span>
          {/* 폴더 삭제 버튼 (기본 폴더/온라인 폴더 제외) */}
          {!(isDefaultFolder || isOnlineFolder) && (
            <button
              onClick={e => {
                e.stopPropagation();
                handleRemoveFolder(folder.id, folder.name, isOnlineFolder);
              }}
              className="p-1.5 rounded-full transition-all duration-300 hover:scale-110 text-gray-500 hover:text-red-400"
              title="폴더 삭제"
              disabled={loading}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </button>
    );
  };

  const currentItems = tab === 'recent' ? recents : favorites;

  return (
    <div className="p-3 flex-1 overflow-y-auto flex flex-col">
      {/* 탭 헤더 + 즐겨찾기 관리 아이콘 */}
      <div className="flex gap-0 mb-0 flex-shrink-0 items-center relative">
        <button
          className={`py-3 px-4 rounded-t-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-b-0 ${
            tab === 'recent'
              ? 'bg-neon-cyan text-black border-neon-cyan'
              : 'bg-dark-card text-neon-cyan border-dark-border hover:bg-neon-cyan hover:bg-opacity-5'
          }`}
          style={{ width: 'calc(50% - 10px)' }}
          onClick={() => setTab('recent')}
        >
          <Clock size={14} />
          최근 본 영상
        </button>
        <div className="relative flex items-center" style={{ width: 'calc(50% + 10px)' }}>
          <button
            className={`w-full py-3 px-4 rounded-t-lg font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 border border-b-0 ${
              tab === 'favorites'
                ? 'bg-neon-pink text-black border-neon-pink'
                : 'bg-dark-card text-neon-pink border-dark-border hover:bg-neon-pink hover:bg-opacity-5'
            }`}
            onClick={() => setTab('favorites')}
          >
            <Heart size={14} />
            찜 영상 목록
          </button>
        </div>
      </div>
      


      {/* 폴더 선택 모달 */}
      {selectedVideo && (
        <FolderSelector
          isOpen={folderSelectorOpen}
          onClose={() => {
            setFolderSelectorOpen(false);
            setSelectedVideo(null);
          }}
          onSelect={handleFolderSelect}
          video={selectedVideo}
        />
      )}

      {/* 콘텐츠 영역 */}
      <div className="flex-1 border border-dark-border border-t-0 rounded-b-lg overflow-hidden flex flex-col">
        {/* 콘텐츠 리스트 */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pt-4 pb-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-1">
              {tab === 'favorites' ? (
                selectedFolderId ? (
                  // 특정 찜 목록의 찜 영상들 보기
                  <>
                    <div className="flex items-center justify-between mb-2 px-3">
                      <button
                        onClick={handleBackToFolders}
                        className="p-1.5 rounded-full transition-all duration-300 hover:scale-110 text-gray-500 hover:text-neon-pink"
                        title="뒤로가기"
                      >
                        <ArrowLeft size={16} />
                      </button>
                      <h3 className="font-bold text-lg text-white">
                        {selectedFolderId === 'default' ? '기본 찜 목록' : folders.find(f => f.id === selectedFolderId)?.name}
                      </h3>
                      <div className="w-8"></div>
                    </div>
                    {favorites.map((item, index) => renderListItem(item, index))}
                    
                    {/* 온라인 공유 버튼 */}
                    {favorites.length > 0 && (
                      <div className="mt-2">
                        {!showShareModal ? (
                          <button
                            onClick={handleShareClick}
                            className="flex items-center justify-center w-full py-2 px-3 rounded-lg border transition-all duration-300 cursor-pointer bg-dark-card text-neon-yellow border-dark-border hover:bg-neon-yellow hover:bg-opacity-5 hover:border-neon-yellow"
                          >
                            <Share2 size={16} className="mr-2" />
                            <span className="font-medium text-sm">찜 목록 온라인 공유하기</span>
                          </button>
                        ) : (
                          <div className="bg-dark-card border border-neon-yellow rounded-lg p-3 space-y-3">
                            <div className="flex items-center gap-2">
                              <Share2 size={16} className="text-neon-yellow" />
                              <span className="font-medium text-sm text-neon-yellow">온라인 공유</span>
                            </div>
                            <input
                              type="text"
                              value={shareTitle}
                              onChange={(e) => setShareTitle(e.target.value)}
                              placeholder="공유할 제목을 입력하세요"
                              className="w-full bg-dark-bg border border-gray-600 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-neon-yellow placeholder-gray-400"
                              maxLength={50}
                              autoFocus
                            />
                            <div className="text-xs text-gray-400 mb-2">
                              {shareTitle.length}/50 • {favorites.length}개 항목 공유
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleShareCancel}
                                disabled={shareLoading}
                                className="flex items-center justify-center flex-1 py-1.5 px-3 rounded border border-gray-600 text-gray-400 hover:bg-gray-700 transition-colors text-sm disabled:opacity-50"
                              >
                                <X size={14} className="mr-1" />
                                취소
                              </button>
                              <button
                                onClick={handleShareSubmit}
                                disabled={shareLoading || !shareTitle.trim()}
                                className="flex items-center justify-center flex-1 py-1.5 px-3 rounded bg-neon-yellow text-black hover:bg-yellow-300 transition-colors text-sm disabled:opacity-50 font-medium"
                              >
                                {shareLoading ? (
                                  <>
                                    <LoadingSpinner />
                                    <span className="ml-1">공유중...</span>
                                  </>
                                ) : (
                                  <>
                                    <Check size={14} className="mr-1" />
                                    공유
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  // 찜 목록들 보기 (기본 찜 목록 + 사용자 생성 찜 목록들)
                  <>
                    <div className="mb-1 px-3">
                      <h3 className="font-medium text-sm text-gray-300">로딩할 찜 목록을 선택해 주세요</h3>
                    </div>
                    {/* 기본 찜 목록 */}
                    <button
                      onClick={() => handleFolderClick('default')}
                      className="flex items-center justify-between w-full py-2 px-3 rounded-lg border transition-all duration-300 cursor-pointer bg-dark-card text-neon-cyan border-dark-border hover:bg-neon-cyan hover:bg-opacity-5"
                    >
                      <div className="flex items-center">
                        <Folder size={16} className="mr-2 text-neon-cyan" />
                        <span className="font-medium text-sm">기본 찜 목록</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {folders.find(f => f.name === '기본 폴더')?.count || 0}개
                      </span>
                    </button>
                    {/* 사용자 생성 찜 목록들 */}
                    {folders.filter(f => f.name !== '기본 폴더').map((folder, index) => renderFolderItem(folder, index))}
                    
                    {/* 찜 목록 추가 영역 */}
                    {isAddingList ? (
                      <div className="flex items-center gap-2 py-2 px-3">
                        <input
                          type="text"
                          value={newListName}
                          onChange={(e) => setNewListName(e.target.value)}
                          placeholder="찜 목록명 입력"
                          className="flex-1 bg-dark-bg border border-neon-cyan text-white px-3 py-2 rounded-lg focus:border-cyan-300 outline-none transition-all duration-300 placeholder-gray-400 text-sm"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddList();
                            if (e.key === 'Escape') handleCancelAddList();
                          }}
                        />
                        <button
                          onClick={handleAddList}
                          disabled={loading || !newListName.trim()}
                          className="p-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="추가"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={handleCancelAddList}
                          disabled={loading}
                          className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="취소"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setIsAddingList(true)}
                          disabled={loading}
                          className="flex items-center justify-center w-full py-2 px-3 rounded-lg border-2 border-dashed border-gray-600 text-gray-400 hover:border-neon-cyan hover:text-neon-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                          <Plus size={16} className="mr-2" />
                          <span className="font-medium text-sm">찜 목록 추가</span>
                        </button>
                        
                        {/* 온라인 찜목록 가져오기 버튼 */}
                        <button
                          onClick={handleOnlineImportClick}
                          disabled={loading}
                          className="flex items-center justify-center w-full py-2 px-3 rounded-lg border-2 border-dashed border-purple-600 text-purple-400 hover:border-neon-pink hover:text-neon-pink transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                        >
                          <Download size={16} className="mr-2" />
                          <span className="font-medium text-sm">온라인 찜목록 가져오기</span>
                        </button>
                      </>
                    )}
                    
                    {/* 에러 메시지 */}
                    {addListError && (
                      <div className="text-red-400 text-xs px-3 py-1">
                        {addListError}
                      </div>
                    )}
                  </>
                )
              ) : (
                // 최근 본 영상들
                recents.map((item, index) => renderListItem(item, index))
              )}
            </div>
          )}

          {/* 빈 상태 표시 */}
          {!loading && (
            (tab === 'recent' && recents.length === 0) && (
              <div className="text-center py-8">
                <Clock size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                <div className="text-gray-400">최근 본 영상이 없습니다</div>
                <div className="text-gray-500 text-sm mt-2">본 영상이 여기에 자동으로 추가됩니다</div>
              </div>
            ) ||
            (tab === 'favorites' && selectedFolderId && favorites.length === 0) && (
              <div className="text-center py-8">
                <Heart size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                <div className="text-gray-400">이 찜 목록에 영상이 없습니다</div>
                <div className="text-gray-500 text-sm mt-2">하트 버튼을 눌러 찜 영상을 추가해 보세요</div>
              </div>
            ) ||
            (tab === 'favorites' && !selectedFolderId && folders.length === 0) && (
              <div className="text-center py-8">
                                 <Folder size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
                <div className="text-gray-400">찜 목록이 없습니다</div>
                <div className="text-gray-500 text-sm mt-2">찜 목록 관리에서 새 목록을 만들어 보세요</div>
              </div>
            )
          )}
        </div>
      </div>

      {/* 온라인 찜목록 가져오기 모달 */}
      {showOnlineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-lg p-6 max-w-6xl w-full mx-2 border border-gray-600 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">온라인 찜목록 가져오기</h3>
              <button
                onClick={handleOnlineModalClose}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {selectedOnlineFolder ? (
                // 선택된 폴더의 상세 내용 표시
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <button
                      onClick={handleBackToOnlineList}
                      className="p-1.5 rounded-full transition-all duration-300 hover:scale-110 text-gray-400 hover:text-neon-pink"
                      title="뒤로가기"
                    >
                      <ArrowLeft size={16} />
                    </button>
                    <div>
                      <h4 className="text-white font-bold text-lg">{selectedOnlineFolder.title}</h4>
                      <p className="text-gray-400 text-sm">
                        {selectedOnlineFolder.authorName} • {selectedOnlineFolder.favoriteCount}개 항목
                      </p>
                    </div>
                  </div>
                  
                  {/* 폴더 내 즐겨찾기 목록 */}
                  <div className="space-y-1 max-h-96 overflow-y-auto neon-scrollbar">
                    {selectedOnlineFolder.favorites.map((favorite, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 bg-dark-bg rounded-lg border border-gray-600"
                      >
                        <img
                          src={favorite.video.snippet?.thumbnails?.default?.url}
                          alt="thumb"
                          className="w-12 h-12 rounded flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0 pr-1">
                          <div className="text-white font-medium text-sm truncate leading-tight">{favorite.video.snippet?.title}</div>
                          <div className="text-gray-400 text-xs truncate leading-tight mt-0.5">{favorite.video.snippet?.channelTitle}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* 가져오기 버튼 */}
                  <div className="flex gap-3 pt-4 border-t border-gray-600">
                    <button
                      onClick={handleBackToOnlineList}
                      className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      돌아가기
                    </button>
                    <button
                      onClick={() => handleImportFolder(selectedOnlineFolder)}
                      disabled={importLoading === selectedOnlineFolder.id}
                      className="flex-1 px-4 py-2 bg-neon-pink text-black rounded-lg hover:bg-pink-300 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
                    >
                      <span className="w-5 flex justify-center items-center">
                        {importLoading === selectedOnlineFolder.id ? (
                          <Loader2 size={20} className="animate-spin text-neon-pink" />
                        ) : (
                          <Download size={20} />
                        )}
                      </span>
                      <span className="ml-2 min-w-[80px] text-center">
                        {importLoading === selectedOnlineFolder.id ? "다운 중..." : "다운로드"}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                // 공유된 폴더 목록 표시
                <div className="space-y-4">
                  {onlineLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <LoadingSpinner />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {sharedFolders.length > 0 ? (
                        sharedFolders.map((folder) => (
                          <div
                            key={folder.id}
                            className="p-3 bg-dark-bg rounded-lg border border-gray-600 hover:border-neon-pink transition-colors cursor-pointer"
                            onClick={() => handleOnlineFolderClick(folder)}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <h4 className="text-white font-medium truncate">{folder.title}</h4>
                                <p className="text-gray-400 text-sm mt-1 line-clamp-2">{folder.description}</p>
                                <div className="flex items-center mt-2 text-xs text-gray-500">
                                  <span className="flex-1 text-left mx-1">작성자: {folder.authorName}</span>
                                  <span className="flex-1 text-center mx-1">{folder.favoriteCount}개 항목</span>
                                  <span className="flex-1 text-right mx-1">다운로드: {folder.downloadCount}회</span>
                                </div>
                              </div>
                              <ArrowLeft className="rotate-180 text-gray-400 flex-shrink-0" size={16} />
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          공유된 찜목록이 없습니다.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListBox;