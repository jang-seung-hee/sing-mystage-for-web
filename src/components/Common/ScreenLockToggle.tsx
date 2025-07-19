import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Lock, Unlock } from 'lucide-react';

interface ScreenLockToggleProps {
  isPlaying: boolean;
  onLockChange: (isLocked: boolean) => void;
  isLocked: boolean;
}

const ScreenLockToggle: React.FC<ScreenLockToggleProps> = ({
  isPlaying,
  onLockChange,
  isLocked
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 화면 터치 감지 및 버튼 표시
  const showButton = useCallback(() => {
    if (!isPlaying) return;
    
    setIsVisible(true);
    
    // 기존 타이머 정리
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // 5초 후 자동 숨김 (호버 중이 아닐 때만)
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 5000);
  }, [isPlaying]);

  // 영상이 재생되면 버튼을 표시하고 5초 후 자동으로 숨김
  useEffect(() => {
    if (isPlaying) {
      setIsVisible(true);
      
      // 기존 타이머 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // 5초 후 자동 숨김
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    } else {
      setIsVisible(false);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPlaying]);

  // 화면 터치 이벤트 리스너 등록 (제거 - 투명 터치 영역으로 대체)
  // useEffect(() => {
  //   if (!isPlaying) return;

  //   // 화면 잠금 상태와 관계없이 항상 터치 감지 (잠금 해제를 위해)
  //   document.addEventListener('touchstart', handleScreenTouch, { passive: true });
  //   document.addEventListener('click', handleScreenTouch, { passive: true });

  //   return () => {
  //     document.removeEventListener('touchstart', handleScreenTouch);
  //     document.removeEventListener('click', handleScreenTouch);
  //   };
  // }, [isPlaying, handleScreenTouch]);

  // 호버 시 타이머 재설정
  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    // 호버가 끝나면 5초 후 다시 숨김
    if (isPlaying) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
  }, [isPlaying]);

  const handleToggle = useCallback(() => {
    const newLockState = !isLocked;
    onLockChange(newLockState);
    
    // 토글 후 3초 더 표시
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 3000);
  }, [isLocked, onLockChange]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // 모바일에서만 표시
  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* 메인 토글 버튼 */}
      {isVisible && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50" style={{ pointerEvents: 'auto' }}>
          {/* 확장된 터치 영역 */}
          <div className="p-3 -m-3" style={{ pointerEvents: 'auto' }}>
            <button
              data-screen-lock-toggle
              onClick={handleToggle}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleMouseEnter}
              onTouchEnd={handleMouseLeave}
              className={`
                relative p-2 rounded-full transition-all duration-300 ease-in-out
                ${isLocked 
                  ? 'bg-red-600/80 border border-red-400 shadow-red-400/50' 
                  : 'bg-neon-cyan/80 border border-neon-cyan shadow-neon-cyan/50'
                }
                hover:scale-110 active:scale-95
                backdrop-blur-sm
                animate-fade-in
                min-w-[48px] min-h-[48px]
                flex items-center justify-center
              `}
              style={{
                boxShadow: isLocked 
                  ? '0 0 20px rgba(239, 68, 68, 0.6), 0 0 40px rgba(239, 68, 68, 0.3)' 
                  : '0 0 20px rgba(0, 255, 255, 0.6), 0 0 40px rgba(0, 255, 255, 0.3)',
                touchAction: 'manipulation',
                pointerEvents: 'auto'
              }}
            >
              {isLocked ? (
                <Lock size={18} className="text-white" />
              ) : (
                <Unlock size={18} className="text-black" />
              )}
              
              {/* 상태 표시 링 */}
              <div className={`
                absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white
                ${isLocked ? 'bg-red-400' : 'bg-neon-cyan'}
                animate-pulse
              `} />
            </button>
            
            {/* 툴팁 */}
            <div className={`
              absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2
              px-3 py-1 rounded-lg text-xs font-medium text-white
              bg-black/80 backdrop-blur-sm border border-gray-600
              opacity-0 group-hover:opacity-100 transition-opacity duration-200
              whitespace-nowrap
            `}>
              {isLocked ? '화면 잠금 해제' : '화면 잠금'}
            </div>
          </div>
        </div>
      )}

      {/* 버튼이 숨겨진 후 나타나는 투명 터치 영역 */}
      {!isVisible && isPlaying && (
        <div 
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
          style={{ 
            pointerEvents: 'auto',
            width: '80px',
            height: '80px',
            marginLeft: '-40px',
            marginBottom: '-40px'
          }}
          onClick={showButton}
          onTouchStart={showButton}
        />
      )}
    </>
  );
};

export default ScreenLockToggle; 