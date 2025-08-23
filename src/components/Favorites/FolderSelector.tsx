import React, { useState, useEffect } from 'react';
import { Folder, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getFolders, FolderItem } from '../../services/foldersService';
import { YouTubeSearchResultItem } from '../../types/youtube';
import LoadingSpinner from '../Common/LoadingSpinner';

interface FolderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (folderId?: string) => void;
  video: YouTubeSearchResultItem;
}

const FolderSelector: React.FC<FolderSelectorProps> = ({ isOpen, onClose, onSelect, video }) => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // 폴더 목록 로드 및 상태 초기화
  useEffect(() => {
    if (isOpen && user) {
      setLoading(true);
      loadFolders();
    } else if (!isOpen) {
      // 모달이 닫힐 때 상태 초기화
      setFolders([]);
      setLoading(true);
    }
  }, [isOpen, user]);

  const loadFolders = async () => {
    setLoading(true);
    try {
      const folderList = await getFolders();
      setFolders(folderList);
    } catch (error) {
      console.error('폴더 목록 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFolderSelect = (folderId?: string) => {
    onSelect(folderId);
    onClose();
  };

  if (!isOpen) return null;

  const videoTitle = video.snippet?.title || '제목 없음';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4 border border-gray-700 max-h-[80vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-lg font-semibold">폴더 선택</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 추가할 비디오 정보 */}
        <div className="bg-gray-700 rounded-lg p-3 mb-4">
          <div className="text-gray-300 text-sm mb-1">추가할 곡:</div>
          <div className="text-white font-medium text-sm truncate" title={videoTitle}>
            {videoTitle}
          </div>
        </div>

        {/* 폴더 목록 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-2">
              {/* 기본 폴더 */}
              <button
                onClick={() => handleFolderSelect()}
                className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left flex items-center gap-3"
              >
                <Folder size={16} className="text-neon-cyan" />
                <div>
                  <div className="text-white font-medium">기본 폴더</div>
                  <div className="text-gray-400 text-sm">기본 즐겨찾기 폴더</div>
                </div>
              </button>

              {/* 사용자 생성 폴더들 */}
              {folders.map((folder) => {
                const isOnlineFolder = folder.isFromOnline;
                const folderColor = isOnlineFolder ? 'neon-pink' : 'neon-cyan';
                return (
                  <button
                    key={folder.id}
                    onClick={() => handleFolderSelect(folder.id)}
                    className="w-full p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-left flex items-center gap-3"
                  >
                    <Folder size={16} className={`text-${folderColor}`} />
                    <div>
                      <div className="text-white font-medium">{folder.name}</div>
                      <div className="text-gray-400 text-sm">{folder.count || 0}개 항목</div>
                    </div>
                  </button>
                );
              })}

              {/* 빈 상태 */}
              {!loading && folders.length === 0 && (
                <div className="text-center py-6">
                  <Folder size={40} className="mx-auto text-gray-500 mb-3" />
                  <div className="text-gray-400 text-sm">
                    폴더를 만들어서 즐겨찾기를 분류해보세요
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 하단 버튼 */}
        <div className="flex gap-3 pt-4 border-t border-gray-600 mt-4">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default FolderSelector;
