
import React, { useState, useRef, useEffect } from 'react';
import { RouteResult, TransportMode } from '../types';
import { Icons } from '../constants';

interface FloatingPIPProps {
  route: RouteResult;
  onExpand: () => void;
  onClose: () => void;
}

const FloatingPIP: React.FC<FloatingPIPProps> = ({ route, onExpand, onClose }) => {
  const [pos, setPos] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<HTMLDivElement>(null);

  const currentStep = route.steps[1] || route.steps[0];

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isDragging) {
      const touch = e.touches[0];
      setPos({
        x: touch.clientX - 100,
        y: touch.clientY - 40
      });
    }
  };

  return (
    <div 
      ref={dragRef}
      onTouchStart={() => setIsDragging(true)}
      onTouchEnd={() => setIsDragging(false)}
      onTouchMove={handleTouchMove}
      onClick={onExpand}
      style={{ 
        left: `${pos.x}px`, 
        top: `${pos.y}px`,
        touchAction: 'none'
      }}
      className="fixed z-[999] w-[220px] bg-white/90 dark:bg-[#121820]/90 backdrop-blur-xl border border-blue-500/30 rounded-3xl p-4 shadow-2xl shadow-blue-500/20 active:scale-95 transition-transform"
    >
      {/* Draggable Handle */}
      <div className="flex justify-center mb-2">
        <div className="w-8 h-1 bg-gray-300 dark:bg-white/10 rounded-full"></div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 text-white">
          {currentStep.mode === TransportMode.BUS ? <Icons.Bus /> : <Icons.Metro />}
        </div>
        <div className="flex-1 overflow-hidden">
          <p className="text-[10px] font-black uppercase text-blue-500 dark:text-blue-400 tracking-widest leading-none mb-1">Próximo paso</p>
          <p className="text-xs font-bold text-gray-900 dark:text-white truncate leading-tight">{currentStep.instruction}</p>
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-white/5 flex justify-between items-center">
        <div className="flex items-baseline gap-1 text-gray-900 dark:text-white">
          <span className="text-lg font-black italic">{route.totalTime}</span>
          <span className="text-[10px] font-bold opacity-30 uppercase">min</span>
        </div>
        <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
          {route.endTime}
        </div>
      </div>

      {/* Close button hidden for PiP focus, but accessible via swipe or long press in real app */}
      <button 
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-gray-50 dark:border-[#0B0F14]"
      >
        ×
      </button>
    </div>
  );
};

export default FloatingPIP;
