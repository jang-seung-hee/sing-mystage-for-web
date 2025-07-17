import React, { useEffect, useState } from 'react';
import { getFavorites, removeFavorite } from '../../services/favoritesService';
import LoadingSpinner from '../Common/LoadingSpinner';
import Alert from '../Common/Alert';
import { useAuth } from '../../hooks/useAuth';

interface FavoritesListProps {
  onPlayAll?: (favorites: any[]) => void;
  onPlayRandom?: (favorites: any[]) => void;
  currentIndex?: number;
  playlist?: any[];
}

const FavoritesList: React.FC<FavoritesListProps> = ({
  onPlayAll,
  onPlayRandom,
  currentIndex,
  playlist,
}) => {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();

  const fetchFavorites = async () => {
    setLoading(true);
    setError(null);
    try {
      const favs = await getFavorites();
      setFavorites(favs);
    } catch (err: any) {
      setError(err.message || '찜 목록 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchFavorites();
  }, [user]);

  const handleRemove = async (id: string) => {
    await removeFavorite(id);
    fetchFavorites();
  };

  // 현재 재생 곡 videoId 추출
  let playingId: string | null = null;
  if (
    typeof currentIndex === 'number' &&
    playlist &&
    playlist.length > 0 &&
    playlist[currentIndex]
  ) {
    playingId = playlist[currentIndex]?.video?.id || playlist[currentIndex]?.id?.videoId || null;
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert message={error} type="error" />;

  return (
    <div className="mt-8">
      <h2 className="font-bold mb-2">찜 목록</h2>
      {/* 전체 재생/랜덤 재생 버튼 추가 */}
      {/* 개발 중: 전체/랜덤 버튼 숨김 처리
      <div className="flex gap-2 mb-3">
        <button
          className="px-3 py-1 rounded bg-neon-cyan text-white font-semibold shadow hover:bg-neon-pink transition-colors"
          onClick={() => onPlayAll && onPlayAll(favorites.map((f) => f.video))}
        >
          전체 재생
        </button>
        <button
          className="px-3 py-1 rounded bg-neon-yellow text-black font-semibold shadow hover:bg-neon-pink transition-colors"
          onClick={() => onPlayRandom && onPlayRandom(favorites.map((f) => f.video))}
        >
          랜덤 재생
        </button>
      </div>
      */}
      {favorites.length > 0 ? (
        <ul className="divide-y border rounded shadow">
          {favorites.map((fav, index) => {
            const vid = fav.video?.id || fav.video?.id?.videoId;
            const isPlaying = playingId && vid && playingId === vid;
            return (
              <li
                key={`favorite-${fav.id}-${index}`}
                className={`p-2 flex items-center justify-between ${isPlaying ? 'bg-neon-cyan/20 border-l-4 border-neon-cyan font-bold text-neon-cyan' : ''}`}
              >
                <div className="flex items-center gap-2">
                  <img
                    src={fav.video.snippet?.thumbnails?.default?.url}
                    alt="thumb"
                    className="w-12 h-12 rounded"
                  />
                  <div>
                    <div className="font-bold">{fav.video.snippet?.title}</div>
                    <div className="text-sm text-gray-600">{fav.video.snippet?.channelTitle}</div>
                  </div>
                </div>
                <button
                  className="text-red-500 hover:underline text-sm"
                  onClick={() => handleRemove(fav.id)}
                >
                  삭제
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="text-center text-gray-500 py-8 border rounded bg-dark-card">
          찜한 곡이 없습니다. 즐겨찾기를 추가해보세요!
        </div>
      )}
    </div>
  );
};

export default FavoritesList;
