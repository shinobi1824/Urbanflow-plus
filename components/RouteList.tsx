
import React from 'react';
import { RouteResult, TransportMode, Language, RouteFilter } from '../types';
import { COLORS, Icons, I18N } from '../constants';

interface RouteListProps {
  routes: RouteResult[];
  onSelect: (route: RouteResult) => void;
  onNavigate: (route: RouteResult) => void;
  onCancel: () => void;
  language: Language;
  activeFilter?: RouteFilter;
  selectedRouteId?: string;
}

const RouteList: React.FC<RouteListProps> = ({ 
  routes, 
  onSelect, 
  onNavigate, 
  onCancel, 
  language, 
  activeFilter, 
  selectedRouteId 
}) => {
  const t = I18N[language];

  const getFilterBadge = (route: RouteResult) => {
    if (!activeFilter) return null;
    const isBest = routes[0].id === route.id;
    if (!isBest) return null;

    let text = "";
    let icon = "🏆";
    
    switch (activeFilter) {
      case 'fastest': text = "Más Rápido"; break;
      case 'cheapest': text = "Ahorro Máximo"; icon = "💰"; break;
      case 'less_walking': text = "Menos Caminata"; icon = "👟"; break;
      case 'less_transfers': text = "Ruta Directa"; icon = "⚡"; break;
      case 'accessible': text = "100% Accesible"; icon = "♿"; break;
    }

    return (
      <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-2 rounded-bl-[24px] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
        <span>{icon}</span>
        {text}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {routes.map((route, idx) => {
        const isSelected = selectedRouteId === route.id;
        
        return (
          <div 
            key={route.id}
            className={`relative rounded-[36px] p-7 cursor-pointer transition-all shadow-xl overflow-hidden active:scale-[0.98] ${
              isSelected
                ? 'border-2 border-blue-500 bg-white dark:bg-[#1a1f26] ring-4 ring-blue-500/10 scale-[1.02]' 
                : 'bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/5 opacity-80 hover:opacity-100'
            } ${route.isPremium ? 'ring-2 ring-indigo-500/40 shadow-indigo-500/10' : ''}`}
            onClick={() => onSelect(route)}
          >
            {getFilterBadge(route)}

            <div className="flex flex-wrap gap-2 mb-4">
               {route.weatherAlert && <span className="bg-blue-600/20 text-blue-600 dark:text-blue-400 border border-blue-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5"><Icons.CloudRain /> Clima Optimizado</span>}
               {route.safetyScore && route.safetyScore > 90 && <span className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/10 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5"><Icons.Shield /> Ruta Segura</span>}
               <span className="bg-emerald-600/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-[9px] font-black uppercase flex items-center gap-1.5"><Icons.Heart /> {route.caloriesBurned || 0} kcal</span>
            </div>

            <div className="flex justify-between items-start mb-6">
              <div className="flex items-baseline gap-2">
                <span className="text-[38px] font-black leading-none text-gray-900 dark:text-white">{route.totalTime}</span>
                <span className="text-lg opacity-30 font-bold uppercase text-gray-900 dark:text-white">min</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold opacity-80 text-gray-900 dark:text-white">{route.startTime} › {route.endTime}</p>
              </div>
            </div>

            <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 mb-6">
              <p className="text-[11px] font-medium opacity-60 italic leading-relaxed text-gray-700 dark:text-gray-300">
                <span className="text-blue-500 font-bold uppercase text-[9px] mr-2">IA Explica:</span>
                {route.aiReasoning}
              </p>
            </div>

            <div className="flex items-center gap-3 mb-6">
              {route.steps.map((step, sIdx) => (
                <React.Fragment key={sIdx}>
                  <div className="flex items-center gap-2">
                     <div className="w-[38px] h-[38px] bg-gray-100 dark:bg-[#1a1f26] rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5">
                        {getModeIcon(step.mode)}
                     </div>
                  </div>
                  {sIdx < route.steps.length - 1 && <div className="w-4 h-[2px] bg-gray-200 dark:bg-white/10 rounded-full"></div>}
                </React.Fragment>
              ))}
            </div>

            {isSelected && (
              <div className="flex gap-3 mb-6 animate-[fadeIn_0.3s_ease-out]">
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigate(route); }}
                  className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-600/20"
                >
                  Ir Ahora
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); onCancel(); }}
                  className="px-6 py-4 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] text-red-500 dark:text-red-400"
                >
                  Cancelar
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-white/5">
               <div className="flex flex-col">
                 <span className="text-[10px] font-black opacity-30 uppercase tracking-widest text-gray-900 dark:text-white">
                   {route.transfers === 0 ? t.transfers_0 : `${route.transfers} ${t.transfers_other}`}
                 </span>
                 <span className="text-[10px] font-bold text-gray-500">Caminata: {route.walkingDistance}m</span>
               </div>
               <div className="text-xl font-black text-gray-900 dark:text-white/90">
                 ${route.cost.toFixed(2)}
               </div>
            </div>
          </div>
        );
      })}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

const getModeIcon = (mode: TransportMode) => {
  switch (mode) {
    case TransportMode.BUS: return <Icons.Bus />;
    case TransportMode.WALK: return <Icons.Walk />;
    case TransportMode.METRO: return <Icons.Metro />;
    default: return <Icons.Clock />;
  }
};

export default RouteList;
