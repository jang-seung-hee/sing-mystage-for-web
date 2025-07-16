import React, { useState, useEffect, useCallback } from 'react';
import { Folder, Plus, Edit3, Trash2, Check, X } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { addFolder, updateFolder, deleteFolder, getFolders, FolderItem } from '../../services/foldersService';
import LoadingSpinner from '../Common/LoadingSpinner';

const FolderList: React.FC = () => {
  const [folders, setFolders] = useState<FolderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  
  const [newListName, setNewListName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const loadFolders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
          try {
        const folderList = await getFolders();
        setFolders(folderList);
      } catch (err: any) {
        setError(err.message || '찜 목록 불러오기 실패');
      } finally {
        setLoading(false);
      }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFolders();
    }
  }, [user, loadFolders]);

  const handleAddFolder = async () => {
    if (!newListName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await addFolder(newListName.trim());
      setNewListName('');
      setIsAdding(false);
      await loadFolders(); // 목록 새로고침
    } catch (err: any) {
      setError(err.message || '찜 목록 추가 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleEditFolder = async (id: string, newName: string) => {
    if (!newName.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      await updateFolder(id, newName.trim());
      setEditingId(null);
      setEditingName('');
      await loadFolders(); // 목록 새로고침
    } catch (err: any) {
      setError(err.message || '찜 목록 수정 실패');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    // 기본 찜 목록은 삭제 불가
    const folder = folders.find(f => f.id === id);
    if (folder?.name === '기본 폴더') {
      setError('기본 찜 목록은 삭제할 수 없습니다');
      return;
    }
    
    setDeleteConfirm(id);
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    
    setLoading(true);
    setError(null);
    try {
      await deleteFolder(deleteConfirm);
      await loadFolders(); // 목록 새로고침
    } catch (err: any) {
      setError(err.message || '찜 목록 삭제 실패');
    } finally {
      setLoading(false);
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const startEdit = (folder: FolderItem) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  if (!user) {
    return (
      <div className="text-center py-8 text-gray-400">
        로그인이 필요합니다
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-900 border border-red-500 text-red-200 p-3 rounded-lg text-sm">
          {error}
          <button 
            onClick={() => setError(null)}
            className="ml-2 text-red-400 hover:text-red-300"
          >
            ✕
          </button>
        </div>
      )}

      {/* 로딩 상태 */}
      {loading && (
        <div className="flex items-center justify-center py-4">
          <LoadingSpinner />
        </div>
      )}

      {/* 폴더 추가 영역 */}
      <div className="flex items-center gap-2">
        {isAdding ? (
          <div className="flex items-center gap-2 flex-1">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="찜 목록명 입력"
              className="flex-1 bg-dark-bg border border-neon-cyan text-white p-2 rounded-lg focus:border-neon-cyan focus:shadow-glow-md outline-none transition-all duration-300 placeholder-gray-400"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddFolder();
                if (e.key === 'Escape') { setIsAdding(false); setNewListName(''); }
              }}
            />
            <button
              onClick={handleAddFolder}
              disabled={loading}
              className="p-2 bg-neon-cyan text-black rounded-lg hover:bg-cyan-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="추가"
            >
              <Check size={16} />
            </button>
            <button
              onClick={() => { setIsAdding(false); setNewListName(''); setError(null); }}
              disabled={loading}
              className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              title="취소"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            disabled={loading}
            className="flex items-center gap-2 bg-dark-bg border border-neon-cyan text-neon-cyan px-4 py-2 rounded-lg hover:bg-neon-cyan hover:text-black hover:shadow-neon-cyan transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            폴더 추가
          </button>
        )}
      </div>

      {/* 폴더 리스트 */}
      <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
        {folders.map((folder) => (
          <div
            key={folder.id}
            className="group bg-dark-bg border border-dark-border rounded-lg px-2 py-1 hover:border-neon-cyan transition-all duration-300 flex items-center justify-between"
          >
            <div className="flex items-center gap-2 flex-1">
              <Folder size={16} className="text-neon-cyan" />
              {editingId === folder.id ? (
                <input
                  type="text"
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1 bg-dark-card border border-neon-cyan text-white p-1 rounded focus:outline-none text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleEditFolder(folder.id, editingName);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                />
              ) : (
                <div className="flex-1 leading-tight">
                  <div className="text-white font-medium text-xs">{folder.name}</div>
                  <div className="text-gray-400 text-xs leading-none">{folder.count}개 즐겨찾기</div>
                </div>
              )}
            </div>

            {/* 버튼 영역 */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              {editingId === folder.id ? (
                <>
                  <button
                    onClick={() => handleEditFolder(folder.id, editingName)}
                    disabled={loading}
                    className="p-0.5 text-neon-green hover:text-green-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="저장"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={loading}
                    className="p-0.5 text-gray-400 hover:text-gray-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="취소"
                  >
                    <X size={12} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => startEdit(folder)}
                    disabled={loading}
                    className="p-0.5 text-neon-yellow hover:text-yellow-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="수정"
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteFolder(folder.id)}
                    disabled={loading || folder.name === '기본 폴더'}
                    className="p-0.5 text-red-400 hover:text-red-300 transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={folder.name === '기본 폴더' ? '기본 폴더는 삭제할 수 없습니다' : '삭제'}
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 빈 상태 */}
      {folders.length === 0 && (
        <div className="text-center py-8">
          <Folder size={48} className="mx-auto text-gray-400 mb-4 opacity-50" />
          <div className="text-gray-400">폴더가 없습니다</div>
          <div className="text-gray-500 text-sm mt-2">새 폴더를 추가해 보세요</div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-sm mx-4 border border-gray-700">
            <h3 className="text-white text-lg font-semibold mb-4">폴더 삭제</h3>
            <p className="text-gray-300 mb-6">정말로 이 폴더를 삭제하시겠습니까?</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-500 transition-colors"
              >
                취소
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FolderList; 