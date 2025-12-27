
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
  isPremiumUser?: boolean; // New prop to control visibility
}

const RouteList: React.FC<RouteListProps> = ({ 
  routes, 
  onSelect, 
  onNavigate, 
  onCancel, 
  language, 
  activeFilter, 
  selectedRouteId,
  isPremiumUser = false
}) => {
  const t = I18N[language];

  // Helper para agrupar visualmente la línea (Burbuja estilo Moovit)
  const renderLineBadge = (step: any, idx: number) => {
    if (step.mode === TransportMode.WALK) {
       return <div key={idx} className="text-gray-400 dark:text-gray-600"><Icons.Walk /></div>;
    }
    if (step.mode === TransportMode.RIDE) {
       return (
        <div key={idx} className="flex items-center gap-1 bg-black text-white dark:bg-white dark:text-black px-2 py-1 rounded-md text-[10px] font-bold uppercase">
           <span>🚕</span> {step.lineName || 'Ride'}
        </div>
       );
    }
    
    // Burbujas de colores para Metro/Bus
    const bgColor = step.color || (step.mode === TransportMode.METRO ? '#EF4444' : '#3B82F6');
    return (
      <div 
        key={idx} 
        className="h-7 min-w-[32px] px-2 flex items-center justify-center rounded-lg text-white text-[11px] font-black shadow-sm"
        style={{ backgroundColor: bgColor }}
      >
        {step.mode === TransportMode.METRO ? <span className="mr-1 text-[9px]">M</span> : null}
        {step.lineName || step.mode}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Context */}
      <div className="flex justify-between items-center px-2 mb-2">
        <span className="text-xs font-black uppercase tracking-widest opacity-40 text-gray-900 dark:text-white">{t.suggestedRoutes}</span>
        <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-md">
          {routes.length} opciones
        </span>
      </div>

      {routes.map((route, idx) => {
        const isSelected = selectedRouteId === route.id;
        const isRideshare = route.steps.some(s => s.mode === TransportMode.RIDE);
        const hasTrafficInfo = route.trafficDelayMinutes !== undefined;
        const isAILocked = route.aiReasoning === "LOCKED_PREMIUM";
        
        return (
          <div 
            key={route.id}
            className={`relative rounded-2xl p-0 cursor-pointer transition-all shadow-sm overflow-hidden active:scale-[0.99] border ${
              isSelected
                ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 ring-1 ring-blue-500' 
                : 'bg-white dark:bg-[#121820] border-gray-200 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/20'
            }`}
            onClick={() => onSelect(route)}
          >
            {/* Main Row */}
            <div className="flex items-center p-4 gap-4">
              
              {/* Left: Time & Duration */}
              <div className="min-w-[70px] flex flex-col items-start">
                <span className="text-xl font-black text-gray-900 dark:text-white leading-none">
                  {route.startTime}
                </span>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{route.totalTime} min</span>
                  {/* Show traffic delay only if data exists (Premium) */}
                  {hasTrafficInfo && route.trafficDelayMinutes! > 0 && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Retraso tráfico"></span>
                  )}
                </div>
              </div>

              {/* Middle: Line Sequence (Moovit Style) */}
              <div className="flex-1 flex flex-wrap items-center gap-2">
                {route.steps.map((step, sIdx) => {
                  if (step.mode === TransportMode.WALK && sIdx > 0 && sIdx < route.steps.length - 1) {
                    return <span key={sIdx} className="text-gray-300 dark:text-gray-600">›</span>;
                  }
                  if (step.mode === TransportMode.WALK) return null; // Ocultar caminata redundante en resumen visual
                  return renderLineBadge(step, sIdx);
                })}
                {/* Fallback si es solo caminar */}
                {route.steps.every(s => s.mode === TransportMode.WALK) && (
                   <div className="flex items-center gap-1 text-gray-500 font-bold text-xs"><Icons.Walk /> Solo caminar</div>
                )}
              </div>

              {/* Right: Price */}
              <div className="text-right pl-2 border-l border-gray-100 dark:border-white/5">
                <div className={`text-sm font-black ${isRideshare ? 'text-gray-900 dark:text-white' : 'text-blue-600 dark:text-blue-400'}`}>
                  ${route.cost.toFixed(2)}
                </div>
                {isRideshare && <span className="text-[9px] font-bold uppercase opacity-50 block">Est.</span>}
              </div>
            </div>

            {/* Expanded Details (Solo si seleccionado) */}
            {isSelected && (
              <div className="bg-gray-50 dark:bg-black/20 p-4 border-t border-gray-200 dark:border-white/5 animate-[fadeIn_0.2s_ease-out]">
                 
                 {/* AI Reasoning Section - Locked or Visible */}
                 <div className="mb-4">
                   {isAILocked ? (
                     <div className="bg-gradient-to-r from-gray-100 to-gray-50 dark:from-white/5 dark:to-transparent p-3 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <span className="text-lg">🔒</span>
                           <div>
                              <p className="text-[10px] font-black uppercase opacity-60">Análisis IA Premium</p>
                              <p className="text-xs font-bold filter blur-[3px] select-none opacity-50">Esta ruta es óptima porque evita congestión.</p>
                           </div>
                        </div>
                        <button className="px-3 py-1.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded-lg">
                           Desbloquear
                        </button>
                     </div>
                   ) : (
                     <p className="text-[11px] font-medium opacity-70 italic text-gray-700 dark:text-gray-300">
                        <span className="font-black mr-1 not-italic">💡 IA:</span>{route.aiReasoning}
                     </p>
                   )}
                 </div>
                 
                 {/* Timeline Compacto */}
                 <div className="space-y-3 pl-2 border-l-2 border-gray-200 dark:border-white/10 ml-1 mb-6">
                    {route.steps.map((step, i) => (
                      <div key={i} className="flex items-center gap-3 relative">
                        <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 absolute -left-[13px] border-2 border-white dark:border-[#121820]"></div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-gray-900 dark:text-white">{step.instruction}</p>
                          <p className="text-[10px] opacity-50">{step.durationMinutes} min</p>
                        </div>
                      </div>
                    ))}
                 </div>

                 <div className="flex gap-3">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onNavigate(route); }}
                      className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black uppercase text-xs shadow-lg shadow-blue-600/20"
                    >
                      Iniciar Viaje
                    </button>
                    {isRideshare && (
                       <button className="px-4 py-3 bg-black text-white dark:bg-white dark:text-black rounded-xl font-black uppercase text-xs">
                          Pedir Uber
                       </button>
                    )}
                    <button 
                      onClick={(e) => { e.stopPropagation(); onCancel(); }}
                      className="px-4 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl font-bold uppercase text-xs"
                    >
                      Cerrar
                    </button>
                 </div>
              </div>
            )}
            
            {/* Footer info (Badges) */}
            {!isSelected && (
              <div className="px-4 pb-3 flex gap-2">
                 {route.isPremium && !isRideshare && <span className="text-[9px] bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded font-bold">PREMIUM</span>}
                 {route.co2Savings > 200 && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-bold">ECO 🌱</span>}
                 {route.walkingDistance < 200 && <span className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">Poco a pie 👟</span>}
              </div>
            )}
          </div>
        );
      })}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; height: 0; }
          to { opacity: 1; height: auto; }
        }
      `}</style>
    </div>
  );
};

export default RouteList;
