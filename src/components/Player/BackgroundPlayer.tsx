import React, { useEffect } from 'react';
import { useBackgroundPlayback } from '../../hooks/useBackgroundPlayback';

interface BackgroundPlayerProps {
  videoId: string;
  title: string;
  artist: string;
  thumbnail: string;
  isPlaying: boolean;
  onPlayStateChange?: (isPlaying: boolean) => void;
}

const BackgroundPlayer: React.FC<BackgroundPlayerProps> = ({
  videoId,
  title,
  artist,
  thumbnail,
  isPlaying,
  onPlayStateChange
}) => {
  const { 
    isBackgroundSupported, 
    updatePlaybackState, 
    updateMediaMetadata 
  } = useBackgroundPlayback({
    onPlayStateChange
  });

  // Media Session 메타데이터 업데이트
  useEffect(() => {
    if (isBackgroundSupported && title && artist) {
      updateMediaMetadata(title, artist, 'Neon Tube', thumbnail);
    }
  }, [title, artist, thumbnail, isBackgroundSupported, updateMediaMetadata]);

  // 재생 상태 업데이트
  useEffect(() => {
    if (isBackgroundSupported) {
      updatePlaybackState(isPlaying);
    }
  }, [isPlaying, isBackgroundSupported, updatePlaybackState]);

  // 백그라운드 재생 지원 여부 표시 (개발용)
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="fixed bottom-4 right-4 bg-dark-card p-2 rounded-lg text-xs text-gray-400">
        백그라운드 재생: {isBackgroundSupported ? '지원됨' : '지원 안됨'}
      </div>
    );
  }

  return null;
};

export default BackgroundPlayer;
