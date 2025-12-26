
import React, { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

interface AdBannerProps {
  type: 'banner' | 'large';
}

const AdBanner: React.FC<AdBannerProps> = ({ type }) => {
  const [isNative, setIsNative] = useState(false);
  
  useEffect(() => {
    // Detect if we are running on a device to use real AdMob
    setIsNative(Capacitor.isNativePlatform());

    if (Capacitor.isNativePlatform()) {
      // INSTRUCCIONES PARA ADMOB REAL:
      // 1. npm install @capacitor-community/admob
      // 2. Import { AdMob, BannerAdSize, BannerAdPosition } from '@capacitor-community/admob';
      // 3. Inicializar: await AdMob.initialize({ requestTrackingAuthorization: true });
      // 4. Mostrar:
      /*
        AdMob.showBanner({
          adId: 'ca-app-pub-YOUR_AD_UNIT_ID', // Reemplazar con ID real de AdMob Console
          adSize: BannerAdSize.BANNER,
          position: BannerAdPosition.BOTTOM_CENTER,
          margin: 0,
        });
      */
      console.log("Native Platform Detected: Initializing AdMob logic...");
    }
  }, []);

  // Si estamos en nativo, devolvemos un placeholder de altura transparente
  // porque el banner nativo se "pega" sobre la webview.
  if (isNative) {
    return <div className={`w-full ${type === 'large' ? 'h-48' : 'h-[50px]'} bg-transparent`} />;
  }

  // Fallback WEB: Diseño visual simulado (para demo o AdSense en futuro)
  return (
    <div className={`w-full overflow-hidden rounded-[28px] border border-gray-200 dark:border-white/5 bg-gray-100 dark:bg-[#121820]/40 flex flex-col items-center justify-center relative group transition-all hover:bg-gray-200 dark:hover:bg-[#121820]/60 ${type === 'large' ? 'h-48' : 'h-24'}`}>
      <div className="absolute top-2 right-3 text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity text-gray-900 dark:text-white">Anuncio • AdMob Web</div>
      
      <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-50 transition-all text-gray-900 dark:text-white">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-current flex items-center justify-center text-xs">AD</div>
        <p className="text-[10px] font-bold uppercase tracking-tighter">Publicidad Relevante</p>
      </div>
      
      {/* Simulación de shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AdBanner;
