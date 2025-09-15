import { useEffect, useRef, useState } from 'react';

interface BackgroundPlaybackOptions {
  onPlayStateChange?: (isPlaying: boolean) => void;
  onVisibilityChange?: (isVisible: boolean) => void;
}

export const useBackgroundPlayback = (options: BackgroundPlaybackOptions = {}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isBackgroundSupported, setIsBackgroundSupported] = useState(false);
  const mediaSessionRef = useRef<MediaSession | null>(null);

  // 백그라운드 재생 지원 여부 확인
  useEffect(() => {
    const checkBackgroundSupport = () => {
      // PWA 설치 여부 확인
      const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                   (window.navigator as any).standalone ||
                   document.referrer.includes('android-app://');

      // Media Session API 지원 확인
      const hasMediaSession = 'mediaSession' in navigator;
      
      // Service Worker 지원 확인
      const hasServiceWorker = 'serviceWorker' in navigator;

      setIsBackgroundSupported(isPWA && hasMediaSession && hasServiceWorker);
    };

    checkBackgroundSupport();
  }, []);

  // Media Session API 설정
  useEffect(() => {
    if (!isBackgroundSupported || !('mediaSession' in navigator)) return;

    mediaSessionRef.current = navigator.mediaSession;

    // Media Session 메타데이터 설정
    const setMediaMetadata = (title: string, artist: string, album: string, artwork: string) => {
      if (mediaSessionRef.current) {
        mediaSessionRef.current.metadata = new MediaMetadata({
          title,
          artist,
          album,
          artwork: [
            { src: artwork, sizes: '96x96', type: 'image/png' },
            { src: artwork, sizes: '128x128', type: 'image/png' },
            { src: artwork, sizes: '192x192', type: 'image/png' },
            { src: artwork, sizes: '256x256', type: 'image/png' },
            { src: artwork, sizes: '384x384', type: 'image/png' },
            { src: artwork, sizes: '512x512', type: 'image/png' }
          ]
        });
      }
    };

    // Media Session 액션 핸들러 설정
    const handlePlay = () => {
      setIsPlaying(true);
      options.onPlayStateChange?.(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
      options.onPlayStateChange?.(false);
    };

    const handleStop = () => {
      setIsPlaying(false);
      options.onPlayStateChange?.(false);
    };

    const handlePreviousTrack = () => {
      // 이전 트랙 로직
      console.log('Previous track');
    };

    const handleNextTrack = () => {
      // 다음 트랙 로직
      console.log('Next track');
    };

    if (mediaSessionRef.current) {
      mediaSessionRef.current.setActionHandler('play', handlePlay);
      mediaSessionRef.current.setActionHandler('pause', handlePause);
      mediaSessionRef.current.setActionHandler('stop', handleStop);
      mediaSessionRef.current.setActionHandler('previoustrack', handlePreviousTrack);
      mediaSessionRef.current.setActionHandler('nexttrack', handleNextTrack);
    }

    return () => {
      if (mediaSessionRef.current) {
        mediaSessionRef.current.setActionHandler('play', null);
        mediaSessionRef.current.setActionHandler('pause', null);
        mediaSessionRef.current.setActionHandler('stop', null);
        mediaSessionRef.current.setActionHandler('previoustrack', null);
        mediaSessionRef.current.setActionHandler('nexttrack', null);
      }
    };
  }, [isBackgroundSupported, options]);

  // 페이지 가시성 변경 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = !document.hidden;
      setIsVisible(visible);
      options.onVisibilityChange?.(visible);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [options]);

  // 백그라운드에서 재생 상태 업데이트
  const updatePlaybackState = (playing: boolean) => {
    setIsPlaying(playing);
    
    if (mediaSessionRef.current) {
      mediaSessionRef.current.playbackState = playing ? 'playing' : 'paused';
    }
  };

  // Media Session 메타데이터 업데이트
  const updateMediaMetadata = (title: string, artist: string, album: string, artwork: string) => {
    if (mediaSessionRef.current) {
      mediaSessionRef.current.metadata = new MediaMetadata({
        title,
        artist,
        album,
        artwork: [
          { src: artwork, sizes: '96x96', type: 'image/png' },
          { src: artwork, sizes: '128x128', type: 'image/png' },
          { src: artwork, sizes: '192x192', type: 'image/png' },
          { src: artwork, sizes: '256x256', type: 'image/png' },
          { src: artwork, sizes: '384x384', type: 'image/png' },
          { src: artwork, sizes: '512x512', type: 'image/png' }
        ]
      });
    }
  };

  return {
    isPlaying,
    isVisible,
    isBackgroundSupported,
    updatePlaybackState,
    updateMediaMetadata
  };
};
