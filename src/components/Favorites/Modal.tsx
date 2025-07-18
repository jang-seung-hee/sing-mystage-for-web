import React, { ReactNode, useEffect, useState, useCallback } from 'react';
import FolderList from './FolderList';
import {
  ChevronDown,
  Music,
  Play,
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Check,
  X,
  Download,
  Share2,
  Upload,
  Search,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFolders, FolderItem } from '../../services/foldersService';
import {
  getFavoritesByFolder,
  removeFavorite,
  moveFavoriteToFolder,
  getFavoritesForPlaylist,
  getFolderBundle,
} from '../../services/favoritesService';
import { shareFolder } from '../../services/sharedFavoritesService';
import SharedFavoritesList from './SharedFavoritesList';
import { FavoriteItem } from '../../types/youtube';
import LoadingSpinner from '../Common/LoadingSpinner';
import { formatDisplayText } from '../../utils/htmlUtils';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  children?: ReactNode;
}

type TabType = 'folder' | 'selection' | 'sharing';

const Modal: React.FC<ModalProps> = ({ open, onClose, children }) => {
  const [activeTab, setActiveTab] = useState<TabType>('folder');
  const [selectedFolder, setSelectedFolder] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [detailView, setDetailView] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [favoritesList, setFavoritesList] = useState<FavoriteItem[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // 공유 관련 상태
  const [sharingView, setSharingView] = useState<'upload' | 'browse'>('browse');
  const [shareTitle, setShareTitle] = useState('');
  const [shareDescription, setShareDescription] = useState('');
  const [shareTags, setShareTags] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareSelectedFolder, setShareSelectedFolder] = useState<string>('');

  const { user } = useAuth();

  // 폴더 목록 로드
  const loadFolders = useCallback(async () => {
    if (!user) return;
    try {
      const folderList = await getFolders();
      setFolders(folderList);
    } catch (error) {
      console.error('폴더 목록 로딩 실패:', error);
    }
  }, [user]);

  // 폴더별 즐겨찾기 로드
  const loadFavorites = useCallback(
    async (folderId?: string) => {
      if (!user) return;
      setLoading(true);
      try {
        const favorites = await getFavoritesByFolder(folderId);
        setFavoritesList(favorites);
      } catch (error) {
        console.error('즐겨찾기 로딩 실패:', error);
        setFavoritesList([]);
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  // 즐겨찾기 삭제
  const handleDeleteFavorite = async (favoriteId: string) => {
    try {
      await removeFavorite(favoriteId);
      // 현재 선택된 폴더의 즐겨찾기 다시 로드
      if (detailView) {
        await loadFavorites(detailView === 'default' ? undefined : detailView);
      }
    } catch (error) {
      console.error('즐겨찾기 삭제 실패:', error);
    } finally {
      setDeleteConfirm(null);
    }
  };

  // 폴더 선택 핸들러
  const handleFolderSelect = async (folderId: string) => {
    setDetailView(folderId);
    setEditingId(null);
    await loadFavorites(folderId === 'default' ? undefined : folderId);
  };

  // 뒤로가기
  const backToFolderList = () => {
    setDetailView(null);
    setEditingId(null);
    setFavoritesList([]);
  };

  // 바로 장착 기능 (현재 재생목록으로 로드)
  const handleQuickLoad = async () => {
    if (!detailView || favoritesList.length === 0) {
      alert('장착할 즐겨찾기가 없습니다.');
      return;
    }

    try {
      const playlistFavorites = await getFavoritesForPlaylist(
        detailView === 'default' ? undefined : detailView,
      );

      // TODO: 실제 플레이어와 연동하여 재생목록에 추가
      // 현재는 콘솔 로그와 알림으로 기능 확인
      const folderName =
        detailView === 'default' ? '기본 폴더' : folders.find((f) => f.id === detailView)?.name;
      alert(`"${folderName}"의 ${playlistFavorites.length}개 즐겨찾기를 재생목록에 추가했습니다.`);
      console.log('바로 장착:', {
        folderId: detailView,
        folderName,
        playlist: playlistFavorites.map((item) => ({
          id: item.video.id,
          title: item.video.snippet?.title,
          channelTitle: item.video.snippet?.channelTitle,
        })),
      });
    } catch (error) {
      console.error('바로 장착 실패:', error);
      alert('재생목록 추가에 실패했습니다.');
    }
  };

  // 바로 공유 기능
  const handleQuickShare = async () => {
    if (!detailView) return;

    try {
      const folderBundle = await getFolderBundle(detailView === 'default' ? undefined : detailView);

      if (!folderBundle.folderInfo || folderBundle.favorites.length === 0) {
        alert('공유할 즐겨찾기가 없습니다.');
        return;
      }

      // TODO: 실제 공유 시스템과 연동
      // 현재는 콘솔 로그와 알림으로 기능 확인
      alert(
        `"${folderBundle.folderInfo.name}" 폴더(${folderBundle.favorites.length}개 항목)를 공유 목록에 업로드했습니다.`,
      );
      console.log('바로 공유:', {
        folderInfo: folderBundle.folderInfo,
        sharedItems: folderBundle.favorites.map((item) => ({
          id: item.video.id,
          title: item.video.snippet?.title,
          channelTitle: item.video.snippet?.channelTitle,
          addedAt: item.createdAt,
        })),
      });
    } catch (error) {
      console.error('바로 공유 실패:', error);
      alert('폴더 공유에 실패했습니다.');
    }
  };

  // 폴더 공유 처리
  const handleShareFolder = async () => {
    if (!shareSelectedFolder || !shareTitle.trim()) {
      alert('폴더를 선택하고 제목을 입력해주세요.');
      return;
    }

    setShareLoading(true);
    try {
      // 선택된 폴더의 즐겨찾기 가져오기
      const folderBundle = await getFolderBundle(
        shareSelectedFolder === 'default' ? undefined : shareSelectedFolder,
      );

      if (!folderBundle.favorites || folderBundle.favorites.length === 0) {
        alert('공유할 즐겨찾기가 없습니다.');
        return;
      }

      // 태그 처리
      const tags = shareTags
        .split(',')
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      // 폴더 공유
      const sharedId = await shareFolder(
        shareTitle,
        shareDescription,
        tags,
        folderBundle.favorites,
      );

      alert(`"${shareTitle}" 폴더가 성공적으로 공유되었습니다!`);

      // 입력 필드 초기화
      setShareTitle('');
      setShareDescription('');
      setShareTags('');
      setShareSelectedFolder('');
      setSharingView('browse');

      console.log('폴더 공유 완료:', { sharedId, title: shareTitle });
    } catch (error) {
      console.error('폴더 공유 실패:', error);
      alert('폴더 공유에 실패했습니다.');
    } finally {
      setShareLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    if (open && user && activeTab === 'selection') {
      loadFolders();
    }
  }, [open, user, activeTab, loadFolders]);

  // 폴더 변경시 즐겨찾기 로드
  useEffect(() => {
    if (selectedFolder && activeTab === 'selection') {
      loadFavorites(selectedFolder === 'default' ? undefined : selectedFolder);
    }
  }, [selectedFolder, activeTab, loadFavorites]);

  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  // 드롭다운 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDropdownOpen) {
        const target = e.target as Element;
        if (!target.closest('.dropdown-container')) {
          setIsDropdownOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  if (!open) return null;

  const tabs = [
    { id: 'folder' as TabType, label: '폴더관리', color: 'neon-cyan' },
    { id: 'selection' as TabType, label: '즐겨찾기 편집', color: 'neon-pink' },
    { id: 'sharing' as TabType, label: '공유', color: 'neon-yellow' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'folder':
        return (
          <div className="p-4">
            <FolderList />
          </div>
        );
      case 'selection':
        return (
          <div className="p-4">
            {detailView ? (
              // 상세 즐겨찾기 목록 화면
              <div className="space-y-4">
                {/* 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={backToFolderList}
                      className="p-1 text-neon-pink hover:text-pink-300 transition-colors duration-300"
                      title="뒤로가기"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    <h3 className="text-neon-pink font-bold text-lg">
                      {detailView === 'default'
                        ? '기본 폴더'
                        : folders.find((f) => f.id === detailView)?.name}{' '}
                      즐겨찾기
                    </h3>
                  </div>

                  {/* 바로 기능 버튼들 */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleQuickLoad}
                      disabled={favoritesList.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 bg-neon-cyan text-black rounded-lg hover:bg-cyan-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      title="현재 폴더의 즐겨찾기를 재생목록에 추가"
                    >
                      <Download size={14} />
                      바로 장착
                    </button>
                    <button
                      onClick={handleQuickShare}
                      disabled={favoritesList.length === 0}
                      className="flex items-center gap-1 px-3 py-1.5 bg-neon-yellow text-black rounded-lg hover:bg-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                      title="현재 폴더를 공유 목록에 업로드"
                    >
                      <Share2 size={14} />
                      바로 공유
                    </button>
                  </div>
                </div>

                {/* 즐겨찾기 상세 리스트 */}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner />
                  </div>
                ) : (
                  <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                    {favoritesList.length > 0 ? (
                      favoritesList.map((favorite) => (
                        <div
                          key={favorite.id}
                          className="group bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 hover:border-neon-pink transition-all duration-300 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            <Music size={14} className="text-neon-pink" />
                            <div className="flex-1 leading-tight">
                              <div className="text-white font-medium text-xs">
                                {formatDisplayText(favorite.video.snippet?.title) || '제목 없음'}
                              </div>
                              <div className="text-gray-400 text-xs leading-none">
                                {formatDisplayText(favorite.video.snippet?.channelTitle) || '채널 없음'}
                              </div>
                            </div>
                          </div>

                          {/* 버튼 영역 */}
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              onClick={() => setDeleteConfirm(favorite.id)}
                              className="p-0.5 text-red-400 hover:text-red-300 transition-colors duration-300"
                              title="삭제"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-400 text-center py-4">
                        이 폴더에 등록된 즐겨찾기가 없습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              // 폴더 선택 화면
              <div className="space-y-4">
                <div className="relative dropdown-container">
                  <label className="block text-white font-medium mb-2">폴더 선택</label>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="w-full bg-dark-bg border border-neon-pink text-white px-4 py-2 rounded-lg flex items-center justify-between hover:border-pink-300 transition-all duration-300"
                  >
                    <span className={selectedFolder ? 'text-white' : 'text-gray-400'}>
                      {selectedFolder
                        ? selectedFolder === 'default'
                          ? '기본 폴더'
                          : folders.find((f) => f.id === selectedFolder)?.name
                        : '폴더를 선택하세요'}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-dark-card border border-neon-pink rounded-lg shadow-neon-pink max-h-40 overflow-y-auto">
                      {/* 기본 폴더 */}
                      <button
                        onClick={() => {
                          setSelectedFolder('default');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-neon-pink hover:text-black transition-all duration-300 first:rounded-t-lg"
                      >
                        기본 폴더
                      </button>

                      {/* 사용자 폴더들 */}
                      {folders.map((folder) => (
                        <button
                          key={folder.id}
                          onClick={() => {
                            setSelectedFolder(folder.id);
                            setIsDropdownOpen(false);
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-neon-pink hover:text-black transition-all duration-300 last:rounded-b-lg"
                        >
                          {folder.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedFolder && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-neon-pink font-medium">즐겨찾기 목록</h4>
                      <button
                        onClick={() => handleFolderSelect(selectedFolder)}
                        className="flex items-center gap-1 px-3 py-1 bg-neon-pink text-black rounded-lg hover:bg-pink-300 transition-all duration-300 text-sm font-medium"
                      >
                        편집하기
                        <ArrowLeft size={12} className="rotate-180" />
                      </button>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner />
                      </div>
                    ) : (
                      <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
                        {favoritesList.length > 0 ? (
                          favoritesList.map((favorite) => (
                            <div
                              key={favorite.id}
                              className="group bg-dark-bg border border-dark-border rounded-lg px-2 py-1.5 hover:border-neon-pink transition-all duration-300 flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <Music size={14} className="text-neon-pink" />
                                <div className="flex-1 leading-tight">
                                  <div className="text-white font-medium text-xs">
                                    {formatDisplayText(favorite.video.snippet?.title) || '제목 없음'}
                                  </div>
                                  <div className="text-gray-400 text-xs leading-none">
                                    {formatDisplayText(favorite.video.snippet?.channelTitle) || '채널 없음'}
                                  </div>
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <Play size={12} className="text-neon-pink" />
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-center py-4">
                            이 폴더에 등록된 즐겨찾기가 없습니다.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {!selectedFolder && (
                  <div className="text-gray-400 text-center py-8">
                    폴더를 선택하면 즐겨찾기 목록이 표시됩니다.
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'sharing':
        return (
          <div className="p-4">
            {/* 상단 네비게이션 */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setSharingView('browse')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  sharingView === 'browse'
                    ? 'bg-neon-yellow text-black'
                    : 'bg-dark-bg border border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-black'
                }`}
              >
                <Search size={14} />
                폴더 찾기
              </button>
              <button
                onClick={() => setSharingView('upload')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${
                  sharingView === 'upload'
                    ? 'bg-neon-yellow text-black'
                    : 'bg-dark-bg border border-neon-yellow text-neon-yellow hover:bg-neon-yellow hover:text-black'
                }`}
              >
                <Upload size={14} />
                폴더 공유
              </button>
            </div>

            {sharingView === 'browse' ? (
              // 공유 폴더 검색 및 가져오기
              <SharedFavoritesList onClose={onClose} />
            ) : (
              // 폴더 공유 업로드
              <div className="space-y-4">
                <h3 className="text-neon-yellow font-bold text-lg">내 폴더 공유하기</h3>

                {/* 폴더 선택 */}
                <div className="space-y-2">
                  <label className="block text-white font-medium text-sm">공유할 폴더</label>
                  <select
                    value={shareSelectedFolder}
                    onChange={(e) => setShareSelectedFolder(e.target.value)}
                    className="w-full bg-dark-bg border border-neon-yellow text-white px-3 py-2 rounded-lg focus:border-yellow-300 outline-none"
                  >
                    <option value="">폴더 선택</option>
                    <option value="default">기본 폴더</option>
                    {folders.map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 제목 입력 */}
                <div className="space-y-2">
                  <label className="block text-white font-medium text-sm">공유 제목 *</label>
                  <input
                    type="text"
                    value={shareTitle}
                    onChange={(e) => setShareTitle(e.target.value)}
                    placeholder="예: 최고의 발라드 모음"
                    className="w-full bg-dark-bg border border-neon-yellow text-white px-3 py-2 rounded-lg focus:border-yellow-300 focus:shadow-glow-md outline-none transition-all duration-300 placeholder-gray-400"
                    maxLength={50}
                  />
                  <div className="text-xs text-gray-400 text-right">{shareTitle.length}/50</div>
                </div>

                {/* 설명 입력 */}
                <div className="space-y-2">
                  <label className="block text-white font-medium text-sm">설명</label>
                  <textarea
                    value={shareDescription}
                    onChange={(e) => setShareDescription(e.target.value)}
                    placeholder="이 폴더에 대한 설명을 입력하세요..."
                    className="w-full bg-dark-bg border border-neon-yellow text-white px-3 py-2 rounded-lg focus:border-yellow-300 focus:shadow-glow-md outline-none transition-all duration-300 placeholder-gray-400 resize-none"
                    rows={3}
                    maxLength={200}
                  />
                  <div className="text-xs text-gray-400 text-right">
                    {shareDescription.length}/200
                  </div>
                </div>

                {/* 태그 입력 */}
                <div className="space-y-2">
                  <label className="block text-white font-medium text-sm">태그</label>
                  <input
                    type="text"
                    value={shareTags}
                    onChange={(e) => setShareTags(e.target.value)}
                    placeholder="발라드, 감성, 드라이브 (쉼표로 구분)"
                    className="w-full bg-dark-bg border border-neon-yellow text-white px-3 py-2 rounded-lg focus:border-yellow-300 focus:shadow-glow-md outline-none transition-all duration-300 placeholder-gray-400"
                  />
                  <div className="text-xs text-gray-400">검색에 도움이 되는 태그를 입력하세요</div>
                </div>

                {/* 공유 버튼 */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSharingView('browse')}
                    className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleShareFolder}
                    disabled={shareLoading || !shareSelectedFolder || !shareTitle.trim()}
                    className="flex-1 px-4 py-2 bg-neon-yellow text-black rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {shareLoading ? (
                      <>
                        <LoadingSpinner />
                        공유 중...
                      </>
                    ) : (
                      <>
                        <Share2 size={16} />
                        공유하기
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center min-h-screen bg-black bg-opacity-60">
      <div className="bg-dark-card rounded-lg shadow-neon-pink p-4 sm:p-6 min-w-[90vw] max-w-[98vw] sm:min-w-[400px] sm:max-w-xl md:max-w-2xl w-full relative mx-2 sm:mx-0">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-neon-pink text-2xl font-bold"
          onClick={onClose}
          title="닫기"
        >
          ×
        </button>

        <div className="mb-6">
          <h2 className="text-white font-bold text-xl mb-4">즐겨찾기 관리</h2>

          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-600">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              let activeClasses = '';

              if (isActive) {
                switch (tab.color) {
                  case 'neon-cyan':
                    activeClasses = 'text-neon-cyan border-neon-cyan shadow-glow-sm';
                    break;
                  case 'neon-pink':
                    activeClasses = 'text-neon-pink border-neon-pink shadow-glow-sm';
                    break;
                  case 'neon-yellow':
                    activeClasses = 'text-neon-yellow border-neon-yellow shadow-glow-sm';
                    break;
                }
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 font-medium transition-all duration-300 border-b-2 ${
                    isActive ? activeClasses : 'text-gray-400 border-transparent hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-dark-bg rounded-lg border border-gray-600 min-h-[300px]">
          {renderTabContent()}
        </div>

        {/* 삭제 확인 다이얼로그 */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 border border-gray-700">
              <h3 className="text-white text-lg font-semibold mb-4">즐겨찾기 삭제</h3>
              <p className="text-gray-300 mb-6">정말로 이 즐겨찾기를 삭제하시겠습니까?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleDeleteFavorite(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

export default Modal;
