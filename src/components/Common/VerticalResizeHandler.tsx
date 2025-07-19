import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GripHorizontal } from 'lucide-react';

interface VerticalResizeHandlerProps {
  onResize: (newHeight: number) => void;
  minHeight?: number;
  maxHeight?: number;
  initialHeight?: number;
  currentHeight?: number;
}

const VerticalResizeHandler: React.FC<VerticalResizeHandlerProps> = ({
  onResize,
  minHeight = 150,
  maxHeight = 400,
  initialHeight = 197,
  currentHeight
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const handlerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(currentHeight || initialHeight);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
  }, [currentHeight, initialHeight]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(currentHeight || initialHeight);
    document.body.style.userSelect = 'none';
  }, [currentHeight, initialHeight]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaY = e.clientY - startY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
    
    onResize(newHeight);
  }, [isDragging, startY, startHeight, minHeight, maxHeight, onResize]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const deltaY = e.touches[0].clientY - startY;
    const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
    
    onResize(newHeight);
  }, [isDragging, startY, startHeight, minHeight, maxHeight, onResize]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, [isDragging]);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    document.body.style.userSelect = '';
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: false });
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  return (
    <div
      ref={handlerRef}
      className="w-full h-1 bg-transparent hover:bg-neon-cyan/50 cursor-row-resize transition-colors duration-200 group relative z-10"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ touchAction: 'none' }}
    >
      {/* 드래그 핸들러 시각적 표시 */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="h-0.5 w-8 bg-neon-cyan rounded-full shadow-neon-cyan"></div>
      </div>
      
      {/* 터치 영역 확장 */}
      <div className="absolute top-0 left-0 h-4 w-full -translate-y-2"></div>
    </div>
  );
};

export default VerticalResizeHandler;