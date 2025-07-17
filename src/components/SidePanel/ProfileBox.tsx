import React from 'react';
import { useAuth } from '../../hooks/useAuth';

const ProfileBox: React.FC = () => {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="border-b border-dark-border">
      {/* 로고와 프로필을 한 줄로 합친 섹션 */}
      <div className="py-6 px-4 flex items-center gap-4 bg-gradient-to-r from-transparent via-dark-card to-transparent">
        {/* 왼쪽: 타이틀 로고 (70%) */}
        <div className="flex-[2] flex justify-center">
          <div className="relative">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow bg-clip-text text-transparent animate-pulse-glow whitespace-nowrap">
              Neon Music
            </h1>
            {/* 네온 글로우 이펙트 */}
            <div className="absolute -inset-[6px] bg-gradient-to-r from-neon-cyan via-neon-pink to-neon-yellow rounded-lg opacity-20 blur-sm animate-pulse"></div>
          </div>
        </div>

        {/* 구분선 */}
        <div className="w-px h-12 bg-dark-border"></div>

        {/* 오른쪽: 프로필 정보 (30%) */}
        <div className="flex-1 flex items-center gap-2">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt="프로필"
              className="w-8 h-8 rounded-full ring-1 ring-neon-cyan shadow-glow-sm"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-dark-card border border-neon-cyan flex items-center justify-center text-sm font-bold text-neon-cyan shadow-glow-sm">
              {user.displayName ? user.displayName[0] : (user.email ?? '')[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="font-bold text-white text-xs truncate">
              {user.displayName || user.email}
            </div>
            <button
              className="text-xs text-red-400 hover:text-red-300 transition-colors duration-200"
              onClick={logout}
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileBox;
