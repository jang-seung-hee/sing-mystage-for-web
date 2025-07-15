import React, { useEffect, useState } from 'react';
import { getRecents } from '../../services/recentService';
import LoadingSpinner from '../Common/LoadingSpinner';
import Alert from '../Common/Alert';
import { useAuth } from '../../hooks/useAuth';

const RecentPlayedList: React.FC = () => {
  const [recents, setRecents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchRecents = async () => {
    setLoading(true);
    setError(null);
    try {
      const items = await getRecents();
      setRecents(items);
    } catch (err: any) {
      setError(err.message || '최근 재생 불러오기 실패');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchRecents();
  }, [user]);

  if (loading) return <LoadingSpinner />;
  if (error) return <Alert message={error} type="error" />;
  if (!recents.length)
    return <div className="text-center text-gray-500">최근 재생한 곡이 없습니다.</div>;

  return (
    <div className="mt-8">
      <h2 className="font-bold mb-2">최근 재생 목록</h2>
      <ul className="divide-y border rounded shadow">
        {recents.map((item, index) => (
          <li key={`recent-${item.id}-${index}`} className="p-2 flex items-center gap-2">
            <img
              src={item.video.snippet?.thumbnails?.default?.url}
              alt="thumb"
              className="w-12 h-12 rounded"
            />
            <div>
              <div className="font-bold">{item.video.snippet?.title}</div>
              <div className="text-sm text-gray-600">{item.video.snippet?.channelTitle}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RecentPlayedList;
