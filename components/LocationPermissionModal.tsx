
import React from 'react';
import { Icons } from '../constants';

interface LocationPermissionModalProps {
  onRequest: () => void;
  status: 'prompt' | 'granted' | 'denied';
  onDismiss: () => void;
}

const LocationPermissionModal: React.FC<LocationPermissionModalProps> = ({ onRequest, status, onDismiss }) => {
  const isDenied = status === 'denied';

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[900] animate-[slideUp_0.4s_ease-out]">
      <div className="bg-white/95 dark:bg-[#1a1f26]/95 backdrop-blur-xl border border-blue-500/20 rounded-[32px] p-6 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
        
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/10 rounded-bl-full -mr-4 -mt-4"></div>
        
        <button 
          onClick={onDismiss}
          className="absolute top-4 right-4 p-2 opacity-30 hover:opacity-100 transition-opacity"
        >
          ✕
        </button>

        <div className="flex items-start gap-5">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg shrink-0 ${isDenied ? 'bg-red-100 dark:bg-red-500/10 text-red-500' : 'bg-blue-100 dark:bg-blue-500/10 text-blue-600'}`}>
            {isDenied ? '🚫' : '📍'}
          </div>
          
          <div className="flex-1">
            <h3 className="font-black text-lg leading-tight mb-1 text-gray-900 dark:text-white">
              {isDenied ? "GPS Desactivado" : "Activa tu Ubicación"}
            </h3>
            <p className="text-sm font-medium opacity-60 leading-relaxed text-gray-800 dark:text-gray-300 mb-4">
              {isDenied 
                ? "El acceso fue denegado. Por favor, habilita la ubicación en la configuración de tu navegador para ver rutas reales." 
                : "UrbanFlow+ necesita tu GPS para calcular las mejores rutas desde tu posición exacta."}
            </p>

            <button 
              onClick={onRequest}
              className={`w-full py-3.5 rounded-xl font-black uppercase tracking-widest text-xs shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 ${
                isDenied 
                  ? 'bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-white cursor-not-allowed' 
                  : 'bg-blue-600 text-white shadow-blue-600/30'
              }`}
            >
              {isDenied ? (
                <span>Revisa Ajustes del Navegador</span>
              ) : (
                <>
                  <Icons.Pin /> ACTIVAR AHORA
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default LocationPermissionModal;
