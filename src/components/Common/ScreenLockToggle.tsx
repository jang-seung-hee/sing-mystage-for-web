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
    
    // 잠금 상태가 아닐 때만 자동 숨김 타이머 설정
    if (!isLocked) {
      // 기존 타이머 정리
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      // 5초 후 자동 숨김 (호버 중이 아닐 때만)
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
  }, [isPlaying, isLocked]);

  // 영상이 재생되면 버튼을 표시하고 5초 후 자동으로 숨김
  useEffect(() => {
    if (isPlaying) {
      setIsVisible(true);
      
      // 잠금 상태가 아닐 때만 자동 숨김 타이머 설정
      if (!isLocked) {
        // 기존 타이머 정리
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        // 5초 후 자동 숨김
        timeoutRef.current = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
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
  }, [isPlaying, isLocked]);

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
    // 호버가 끝나면 5초 후 다시 숨김 (잠금 상태가 아닐 때만)
    if (isPlaying && !isLocked) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
    }
  }, [isPlaying, isLocked]);

  const handleToggle = useCallback(() => {
    const newLockState = !isLocked;
    onLockChange(newLockState);
    
    // 토글 후 3초 더 표시 (잠금 상태가 아닐 때만)
    if (!newLockState) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false);
      }, 3000);
    }
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
  const isLandscape = window.matchMedia('(orientation: landscape)').matches;
  
  // 모바일이 아니거나 (가로모드이면서 잠금 상태가 아닌 경우) 표시하지 않음
  if (!isMobile || (isLandscape && !isLocked)) {
    return null;
  }

  return (
    <>
      {/* 메인 토글 버튼 */}
      {isVisible && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50" style={{ pointerEvents: 'auto' }}>
          <button
            data-screen-lock-toggle
            onClick={handleToggle}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleMouseEnter}
            onTouchEnd={handleMouseLeave}
            className={`
              relative p-1.5 rounded-full transition-all duration-300 ease-in-out
              ${isLocked 
                ? 'bg-red-600/80 border border-red-400 shadow-red-400/50' 
                : 'bg-neon-cyan/80 border border-neon-cyan shadow-neon-cyan/50'
              }
              hover:scale-110 active:scale-95
              backdrop-blur-sm
              animate-fade-in
              min-w-[36px] min-h-[36px]
              flex items-center justify-center
            `}
            style={{
              boxShadow: isLocked 
                ? '0 0 15px rgba(239, 68, 68, 0.6), 0 0 30px rgba(239, 68, 68, 0.3)' 
                : '0 0 15px rgba(0, 255, 255, 0.6), 0 0 30px rgba(0, 255, 255, 0.3)',
              touchAction: 'manipulation',
              pointerEvents: 'auto'
            }}
          >
            {isLocked ? (
              <Lock size={14} className="text-white" />
            ) : (
              <Unlock size={14} className="text-black" />
            )}
            
            {/* 상태 표시 링 */}
            <div className={`
              absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full border border-white
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
      )}

      {/* 버튼이 숨겨진 후 나타나는 투명 터치 영역 (잠금 상태가 아닐 때만) */}
      {!isVisible && isPlaying && !isLocked && (
        <div 
          className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-40"
          style={{ 
            pointerEvents: 'auto',
            width: '60px',
            height: '60px',
            marginLeft: '-30px',
            marginBottom: '-30px'
          }}
          onClick={showButton}
          onTouchStart={showButton}
        />
      )}
    </>
  );
};

export default ScreenLockToggle;