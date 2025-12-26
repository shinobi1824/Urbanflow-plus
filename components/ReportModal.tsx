
import React from 'react';
import { Icons, I18N } from '../constants';
import { Language } from '../types';

interface ReportModalProps {
  onClose: () => void;
  onReport: (type: string) => void;
  isSharing?: boolean;
  language?: Language;
}

const ReportModal: React.FC<ReportModalProps> = ({ onClose, onReport, isSharing, language = Language.ES }) => {
  const t = I18N[language];
  
  const reports = [
    { id: 'full', label: 'Bus Lleno', icon: '👥', color: 'bg-orange-500' },
    { id: 'delay', label: 'Retraso', icon: '⏳', color: 'bg-red-500' },
    { id: 'ac', label: 'Sin Aire', icon: '🔥', color: 'bg-yellow-600' },
    { id: 'safe', label: 'Seguro', icon: '✅', color: 'bg-emerald-500' },
  ];

  return (
    <div className="absolute inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm p-6">
      <div className="w-full bg-white dark:bg-[#121820] rounded-[40px] p-8 border border-gray-200 dark:border-white/10 shadow-3xl animate-[slideUp_0.3s_ease-out] text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-black uppercase tracking-tight">Reportar estado</h2>
          <button onClick={onClose} className="p-2 opacity-40 hover:opacity-100 transition-opacity">
             <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-8">
          {reports.map((r) => (
            <button 
              key={r.id} 
              onClick={() => onReport(r.id)}
              className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-[#1a1f26] rounded-3xl border border-gray-200 dark:border-white/5 active:scale-95 transition-all group hover:border-blue-500/30"
            >
              <span className="text-3xl group-hover:scale-110 transition-transform">{r.icon}</span>
              <span className="text-xs font-bold opacity-80">{r.label}</span>
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <button 
            onClick={() => {
              onReport('share_live');
              // Logic for clipboard handled in App.tsx or here
              if (!isSharing) {
                navigator.clipboard.writeText(`https://urbanflow.plus/live/track-${Math.random().toString(36).substr(2, 9)}`);
              }
            }}
            className={`w-full py-5 rounded-[24px] font-black flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] ${
              isSharing 
                ? 'bg-red-500/10 border border-red-500/20 text-red-500 shadow-red-500/5' 
                : 'bg-blue-600 text-white shadow-blue-600/20'
            }`}
          >
            {isSharing ? (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                DETENER SEGUIMIENTO EN VIVO
              </>
            ) : (
              <>
                <Icons.Send />
                {t.shareLive.toUpperCase()}
              </>
            )}
          </button>
          
          <p className="text-[10px] text-center opacity-30 font-bold uppercase tracking-widest text-gray-900 dark:text-white">
            {isSharing ? 'Tus contactos ya no podrán ver tu ubicación' : 'Se copiará un enlace dinámico al portapapeles'}
          </p>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default ReportModal;
