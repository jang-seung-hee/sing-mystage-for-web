import React, { useState, useEffect } from 'react';
import { X, Smartphone, Download, Volume2 } from 'lucide-react';
import { isPWAInstalled } from '../../utils/serviceWorkerUtils';

const BackgroundPlaybackGuide: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    setIsPWA(isPWAInstalled());
    
    // PWA가 설치되지 않은 경우에만 가이드 표시
    if (!isPWAInstalled()) {
      const hasSeenGuide = localStorage.getItem('background-playback-guide-seen');
      if (!hasSeenGuide) {
        setIsVisible(true);
      }
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('background-playback-guide-seen', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-neon-cyan flex items-center">
            <Volume2 className="mr-2" size={24} />
            백그라운드 재생 설정
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-gray-300">
          <div className="flex items-start space-x-3">
            <Smartphone className="text-neon-cyan mt-1" size={20} />
            <div>
              <h4 className="font-semibold text-white mb-1">1. PWA 설치</h4>
              <p className="text-sm">
                크롬 메뉴 → "홈 화면에 추가" 또는 "앱 설치"를 선택하여 앱을 설치하세요.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <Download className="text-neon-cyan mt-1" size={20} />
            <div>
              <h4 className="font-semibold text-white mb-1">2. 백그라운드 재생 활성화</h4>
              <p className="text-sm">
                설치된 앱에서 재생하면 백그라운드에서도 계속 재생됩니다.
              </p>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <p className="text-xs text-gray-400">
              💡 <strong>팁:</strong> 백그라운드 재생을 위해서는 PWA 설치가 필요합니다. 
              일반 브라우저에서는 탭이 비활성화되면 재생이 일시정지될 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 bg-neon-cyan text-black rounded-lg font-semibold hover:bg-neon-cyan/80 transition-colors"
          >
            확인
          </button>
          <button
            onClick={() => {
              localStorage.removeItem('background-playback-guide-seen');
              handleClose();
            }}
            className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
          >
            다시 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
};

export default BackgroundPlaybackGuide;
