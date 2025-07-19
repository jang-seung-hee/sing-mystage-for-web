import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizeHandlerProps {
  onResize: (newWidth: number) => void;
  minWidth?: number;
  maxWidth?: number;
  initialWidth?: number;
  currentWidth?: number;
}

const ResizeHandler: React.FC<ResizeHandlerProps> = ({
  onResize,
  minWidth = 280,
  maxWidth = 600,
  initialWidth = 360,
  currentWidth
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [startWidth, setStartWidth] = useState(0);
  const handlerRef = useRef<HTMLDivElement>(null);



  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setStartX(e.clientX);
    setStartWidth(currentWidth || initialWidth);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [currentWidth, initialWidth]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setStartWidth(currentWidth || initialWidth);
    document.body.style.userSelect = 'none';
  }, [currentWidth, initialWidth]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - startX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
    
    onResize(newWidth);
  }, [isDragging, startX, startWidth, minWidth, maxWidth, onResize]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    
    e.preventDefault();
    const deltaX = e.touches[0].clientX - startX;
    const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
    
    onResize(newWidth);
  }, [isDragging, startX, startWidth, minWidth, maxWidth, onResize]);

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
      className="absolute right-0 top-0 bottom-0 w-1 bg-transparent hover:bg-neon-cyan/50 cursor-col-resize transition-colors duration-200 group z-50"
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      style={{ touchAction: 'none' }}
    >
      {/* 드래그 핸들러 시각적 표시 */}
      <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <div className="w-0.5 h-8 bg-neon-cyan rounded-full shadow-neon-cyan"></div>
      </div>
      
      {/* 터치 영역 확장 */}
      <div className="absolute left-0 top-0 w-4 h-full -translate-x-2"></div>
    </div>
  );
};

export default ResizeHandler; 