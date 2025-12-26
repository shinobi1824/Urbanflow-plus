
import React, { useState } from 'react';
import { Icons } from '../constants';
import { GeoArea } from '../types';

interface OfflineManagerProps {
  onClose: () => void;
}

const OfflineManager: React.FC<OfflineManagerProps> = ({ onClose }) => {
  const [downloading, setDownloading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const zones: GeoArea[] = [
    { id: 'sp', name: 'São Paulo Centro', x1: 400, y1: 400, x2: 600, y2: 600, sizeMB: 45 },
    { id: 'md', name: 'Madrid Almendra Central', x1: 300, y1: 300, x2: 500, y2: 500, sizeMB: 32 },
    { id: 'ny', name: 'Manhattan & Brooklyn', x1: 200, y1: 200, x2: 500, y2: 500, sizeMB: 120 },
  ];

  const startDownload = (id: string) => {
    setDownloading(id);
    let p = 0;
    const interval = setInterval(() => {
      p += 5;
      setProgress(p);
      if (p >= 100) {
        clearInterval(interval);
        setDownloading(null);
        setProgress(0);
      }
    }, 100);
  };

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white p-8 pt-16 flex flex-col">
      <div className="flex justify-between items-center mb-10">
        <button onClick={onClose} className="p-2 -ml-2"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M19 12H5M12 19l-7-7 7-7"/></svg></button>
        <h1 className="text-xl font-black uppercase tracking-widest">Mapas Offline</h1>
        <div className="w-8"></div>
      </div>

      <div className="bg-blue-600/10 border border-blue-500/20 p-6 rounded-[32px] mb-10">
        <div className="flex items-center gap-4 mb-2">
          <div className="text-blue-500"><Icons.Database /></div>
          <h2 className="font-bold">Ahorro de Datos</h2>
        </div>
        <p className="text-xs opacity-50 leading-relaxed">Descarga zonas frecuentes para navegar sin internet y ahorrar hasta un 80% de batería.</p>
      </div>

      <h3 className="text-[10px] font-black opacity-30 uppercase tracking-[0.2em] mb-6">Zonas Recomendadas</h3>
      
      <div className="space-y-4">
        {zones.map(zone => (
          <div key={zone.id} className="bg-white dark:bg-[#121820] p-6 rounded-[32px] border border-gray-200 dark:border-white/5 flex items-center justify-between shadow-sm dark:shadow-none">
            <div>
              <h4 className="font-bold text-base">{zone.name}</h4>
              <p className="text-xs opacity-40">{zone.sizeMB} MB • Actualizado hoy</p>
            </div>
            
            {downloading === zone.id ? (
              <div className="relative w-12 h-12 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-200 dark:text-white/5" />
                  <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-blue-500" strokeDasharray={125.6} strokeDashoffset={125.6 * (1 - progress / 100)} />
                </svg>
                <span className="absolute text-[8px] font-black">{progress}%</span>
              </div>
            ) : (
              <button 
                onClick={() => startDownload(zone.id)}
                className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto pt-10 text-center">
        <p className="text-[10px] font-bold opacity-20 uppercase tracking-widest">Almacenamiento usado: 1.2 GB / 128 GB</p>
      </div>
    </div>
  );
};

export default OfflineManager;
