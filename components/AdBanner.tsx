
import React from 'react';

interface AdBannerProps {
  type: 'banner' | 'large';
}

const AdBanner: React.FC<AdBannerProps> = ({ type }) => {
  return (
    <div className={`w-full overflow-hidden rounded-[28px] border border-white/5 bg-[#121820]/40 flex flex-col items-center justify-center relative group transition-all hover:bg-[#121820]/60 ${type === 'large' ? 'h-48' : 'h-24'}`}>
      <div className="absolute top-2 right-3 text-[8px] font-black uppercase tracking-widest opacity-20 group-hover:opacity-40 transition-opacity">Anuncio • AdMob</div>
      
      <div className="flex flex-col items-center gap-2 opacity-30 group-hover:opacity-50 transition-all">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/20 flex items-center justify-center text-xs">AD</div>
        <p className="text-[10px] font-bold uppercase tracking-tighter">Publicidad Relevante</p>
      </div>
      
      {/* Simulación de shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_3s_infinite]"></div>
      
      <style>{`
        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default AdBanner;
