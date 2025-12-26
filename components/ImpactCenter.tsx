
import React from 'react';
import { AppState, Achievement } from '../types';
import { I18N, Icons } from '../constants';

interface ImpactCenterProps {
  state: AppState;
}

const ImpactCenter: React.FC<ImpactCenterProps> = ({ state }) => {
  const t = I18N[state.user.language];
  const profile = state.auth?.profile || {
    name: "Invitado",
    points: 1250,
    level: 4,
    levelTitle: "Explorador Urbano",
    treesPlanted: 12,
    initials: "I"
  };

  const mockAchievements: Achievement[] = [
    { id: '1', title: 'Maestro del Metro', description: 'Realiza 50 viajes en metro.', icon: '🚇', progress: 35, total: 50, unlocked: false, points: 500 },
    { id: '2', title: 'Guerrero Eco', description: 'Ahorra 5kg de CO2.', icon: '🌱', progress: 4.2, total: 5, unlocked: false, points: 1000 },
    { id: '3', title: 'Viajero Nocturno', description: 'Viaja después de medianoche.', icon: '🌙', progress: 1, total: 1, unlocked: true, points: 250 }
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-y-auto hide-scrollbar pb-32">
      {/* Header Stats */}
      <div className="p-8 pt-16 bg-gradient-to-b from-blue-600/20 to-transparent">
        <div className="flex items-center gap-6 mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-[32px] flex items-center justify-center text-3xl font-black shadow-2xl shadow-blue-600/30 text-white">
            {profile.initials}
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight mb-1">{profile.name}</h1>
            <div className="flex items-center gap-2">
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">{t.level} {profile.level || 1}</span>
              <span className="text-sm font-bold opacity-40">{profile.levelTitle || 'Explorador'}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-[#121820] p-6 rounded-[32px] border border-gray-200 dark:border-white/5">
            <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">{t.flowPoints}</p>
            <div className="text-3xl font-black italic">{profile.points || 0}</div>
          </div>
          <div className="bg-white dark:bg-[#121820] p-6 rounded-[32px] border border-gray-200 dark:border-white/5">
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Árboles</p>
            <div className="text-3xl font-black italic">{profile.treesPlanted || 0}</div>
          </div>
        </div>
      </div>

      {/* Virtual Forest */}
      <div className="px-8 mb-12">
        <h2 className="text-xl font-black tracking-tight mb-4">Tu Bosque Urbano</h2>
        <div className="bg-white dark:bg-[#121820] p-8 rounded-[40px] border border-gray-200 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-gray-900 dark:text-white">
            <Icons.Tree />
          </div>
          <p className="text-sm font-medium opacity-60 mb-6 leading-relaxed max-w-[200px]">
            {t.treesDescription}
          </p>
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: profile.treesPlanted || 0 }).map((_, i) => (
              <div key={i} className="text-2xl animate-bounce" style={{ animationDelay: `${i * 0.1}s` }}>🌲</div>
            ))}
            <div className="w-10 h-10 border-2 border-dashed border-gray-300 dark:border-white/10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 font-black">
              +
            </div>
          </div>
        </div>
      </div>

      {/* Daily Challenges */}
      <div className="px-8 mb-12">
        <h2 className="text-xl font-black tracking-tight mb-6">{t.challenges}</h2>
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-600/10 to-transparent p-6 rounded-[32px] border border-blue-500/10 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base mb-1">Semana Intermodal</h3>
              <p className="text-xs opacity-40 font-medium">Usa 3 transportes diferentes</p>
              <div className="w-32 h-1.5 bg-gray-200 dark:bg-white/5 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-500 w-[66%]"></div>
              </div>
            </div>
            <div className="text-blue-500 font-black text-sm">+500 pts</div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="px-8">
        <h2 className="text-xl font-black tracking-tight mb-6">{t.badges}</h2>
        <div className="grid grid-cols-1 gap-4">
          {mockAchievements.map(ach => (
            <div key={ach.id} className={`p-6 rounded-[32px] border flex items-center gap-6 transition-all ${ach.unlocked ? 'bg-white dark:bg-[#121820] border-emerald-500/20' : 'bg-gray-100 dark:bg-[#0B0F14] border-gray-200 dark:border-white/5 opacity-60'}`}>
              <div className="text-4xl">{ach.icon}</div>
              <div className="flex-1">
                <h3 className="font-black text-base">{ach.title}</h3>
                <p className="text-xs font-medium opacity-40">{ach.description}</p>
                {!ach.unlocked && (
                   <div className="w-full h-1 bg-gray-200 dark:bg-white/5 rounded-full mt-3 overflow-hidden">
                     <div className="h-full bg-blue-500" style={{ width: `${(ach.progress/ach.total)*100}%` }}></div>
                   </div>
                )}
              </div>
              {ach.unlocked && <div className="text-emerald-500"><Icons.Star /></div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ImpactCenter;
