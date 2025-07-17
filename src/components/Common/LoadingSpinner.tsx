import React from 'react';
import { Loader2, Music } from 'lucide-react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col justify-center items-center py-16">
    {/* 네온 스피너 */}
    <div className="relative">
      <Loader2 size={100} className="text-neon-cyan animate-spin" />
      <div className="absolute inset-0 flex items-center justify-center">
        <Music size={40} className="text-neon-pink animate-pulse" />
      </div>
    </div>

    {/* 로딩 텍스트 */}
    <div className="mt-4 text-center">
      <div className="text-neon-cyan font-semibold animate-pulse-glow">검색 중...</div>
      <div className="text-gray-400 text-sm mt-1">잠시만 기다려 주세요</div>
    </div>

    {/* 네온 도트 애니메이션 */}
    <div className="flex space-x-2 mt-4">
      <div
        className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce"
        style={{ animationDelay: '0s' }}
      ></div>
      <div
        className="w-2 h-2 bg-neon-pink rounded-full animate-bounce"
        style={{ animationDelay: '0.2s' }}
      ></div>
      <div
        className="w-2 h-2 bg-neon-yellow rounded-full animate-bounce"
        style={{ animationDelay: '0.4s' }}
      ></div>
    </div>

    <span className="sr-only">Loading...</span>
  </div>
);

export default LoadingSpinner;
