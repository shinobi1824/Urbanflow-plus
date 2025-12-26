
import React from 'react';
import { UserPreferences, Language } from '../types';
import { I18N, Icons } from '../constants';

interface PremiumDashboardProps {
  user: UserPreferences;
  language: Language;
}

const PremiumDashboard: React.FC<PremiumDashboardProps> = ({ user, language }) => {
  const t = I18N[language];

  return (
    <div className="p-6 space-y-8 h-full overflow-y-auto hide-scrollbar bg-gradient-to-b from-blue-500/5 to-transparent bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white">
      {/* Premium Header */}
      <div className="text-center space-y-2">
        <div className="inline-block px-4 py-1 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-tighter mb-2">
          UrbanFlow+ Elite
        </div>
        <h1 className="text-3xl font-black tracking-tight">{t.premium}</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-[250px] mx-auto">{t.premiumSubtitle}</p>
      </div>

      {/* Smart Schedule Card */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">{t.smartSchedule}</h2>
          <span className="text-[10px] font-bold text-blue-500 uppercase">Live AI</span>
        </div>
        <div className="bg-white dark:bg-white/5 border border-blue-500/20 rounded-3xl p-5 shadow-xl shadow-blue-500/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white">
              <Icons.Bus />
            </div>
            <div>
              <p className="text-xs font-bold text-blue-500 uppercase">Next Optimal Trip</p>
              <h3 className="text-lg font-bold">Leave in 4 mins</h3>
            </div>
          </div>
          <p className="text-sm opacity-80 mb-4">{t.exitNow}</p>
          <div className="flex gap-2">
            <button className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-blue-500/30">
              Start Navigation
            </button>
          </div>
        </div>
      </section>

      {/* Heatmap Simulation */}
      <section className="space-y-4">
        <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">{t.heatmap}</h2>
        <div className="h-40 glass rounded-3xl relative overflow-hidden border border-gray-200 dark:border-white/20">
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 via-red-500/20 to-yellow-500/20 blur-2xl"></div>
          <div className="absolute inset-0 p-4 flex flex-col justify-end">
            <div className="flex items-end gap-1 h-12">
              {[40, 70, 45, 90, 65, 30, 85, 50, 60, 95, 70, 40].map((h, i) => (
                <div key={i} className="flex-1 bg-blue-500/40 rounded-t-sm" style={{ height: `${h}%` }}></div>
              ))}
            </div>
            <p className="text-[10px] font-bold mt-2 opacity-60">USAGE INTENSITY - LAST 30 DAYS</p>
          </div>
        </div>
      </section>

      {/* CO2 & Impact */}
      <div className="grid grid-cols-2 gap-4">
        <div className="glass p-4 rounded-3xl border border-green-500/20">
          <p className="text-[10px] font-black text-green-600 dark:text-green-500 uppercase mb-1">CO2 Saved</p>
          <div className="text-2xl font-black">12.4kg</div>
          <p className="text-[10px] opacity-60 mt-1">Total Impact</p>
        </div>
        <div className="glass p-4 rounded-3xl border border-blue-500/20">
          <p className="text-[10px] font-black text-blue-600 dark:text-blue-500 uppercase mb-1">Time Saved</p>
          <div className="text-2xl font-black">4.2h</div>
          <p className="text-[10px] opacity-60 mt-1">AI Optimization</p>
        </div>
      </div>

      {!user.isPremium && (
        <button className="w-full py-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-blue-600/20 uppercase tracking-widest text-sm animate-pulse">
          Start 14-Day Free Trial
        </button>
      )}
    </div>
  );
};

export default PremiumDashboard;
