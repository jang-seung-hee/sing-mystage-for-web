import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const LogoutButton: React.FC = () => {
  const { user, logout, loading } = useAuth();
  if (!user) return null;
  return (
    <button
      onClick={logout}
      className="mt-4 bg-gray-500 text-white py-2 px-4 rounded disabled:opacity-50"
      disabled={loading}
    >
      {loading ? '로그아웃 중...' : '로그아웃'}
    </button>
  );
};

export default LogoutButton;
