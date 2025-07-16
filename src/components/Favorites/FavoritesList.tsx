import React, { useEffect, useState } from 'react';
import { getFavorites, removeFavorite } from '../../services/favoritesService';
import LoadingSpinner from '../Common/LoadingSpinner';
import Alert from '../Common/Alert';
import { useAuth } from '../../hooks/useAuth';

const FavoritesList: React.FC = () => {
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



  if (loading) return <LoadingSpinner />;
  if (error) return <Alert message={error} type="error" />;

  return (
    <div className="mt-8">
      <h2 className="font-bold mb-2">찜 목록</h2>
      
      {favorites.length > 0 ? (
        <ul className="divide-y border rounded shadow">
          {favorites.map((fav, index) => (
            <li key={`favorite-${fav.id}-${index}`} className="p-2 flex items-center justify-between">
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
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 py-8 border rounded">
          찜한 곡이 없습니다.
        </div>
      )}
    </div>
  );
};

export default FavoritesList;
