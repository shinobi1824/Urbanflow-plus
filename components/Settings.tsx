
import React from 'react';
import { Language, UserPreferences } from '../types';
import { I18N, Icons, COLORS } from '../constants';

interface SettingsProps {
  user: UserPreferences;
  profile: {
    name: string;
    email: string;
    initials: string;
    points: number;
    level: number;
    levelTitle: string;
  } | undefined;
  onUpdate: (key: keyof UserPreferences, value: any) => void;
  onNavigate: (page: string) => void;
  onLogout: () => void;
  language: Language;
}

const Settings: React.FC<SettingsProps> = ({ user, profile, onUpdate, onNavigate, onLogout, language }) => {
  const t = I18N[language];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-y-auto hide-scrollbar pb-28">
      <div className="p-6 pt-14 flex items-center">
        <button onClick={() => onNavigate('home')} className="p-3 bg-white/90 dark:bg-[#121820]/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-lg z-20">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-2xl font-black ml-4">{t.navSettings}</h1>
      </div>

      <div className="p-6">
        {profile ? (
          <div className="bg-white dark:bg-[#121820] rounded-[28px] p-6 flex items-center gap-5 border border-gray-200 dark:border-white/10 mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-3xl font-bold">
              {profile.initials}
            </div>
            <div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{profile.email}</p>
              <button onClick={onLogout} className="text-xs text-red-500 mt-1">{t.logout}</button>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#121820] rounded-[28px] p-6 text-center border border-gray-200 dark:border-white/10 mb-8">
            <h2 className="text-lg font-bold mb-2">{t.joinCommunity}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t.joinCommunitySubtext}</p>
            <button onClick={() => onNavigate('login')} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold">{t.login}</button>
          </div>
        )}

        <SettingsSection title={t.preferences}>
          <SettingsToggle
            label={t.darkMode}
            icon={<Icons.Moon />}
            color={COLORS.indigo}
            isActive={user.theme === 'dark'}
            onToggle={() => onUpdate('theme', user.theme === 'dark' ? 'light' : 'dark')}
          />
          <SettingsSelect
            label={t.language}
            icon={<Icons.Globe />}
            color={COLORS.sky}
            options={[
              { value: Language.EN, label: 'English' },
              { value: Language.ES, label: 'Español' },
            ]}
            value={user.language}
            onChange={(e) => onUpdate('language', e.target.value as Language)}
          />
        </SettingsSection>

        <SettingsSection title={t.accessibility}>
           <SettingsToggle
            label={t.accessibilityMode}
            icon={<Icons.Accessibility />}
            color={COLORS.green}
            isActive={user.accessibilityMode}
            onToggle={() => onUpdate('accessibilityMode', !user.accessibilityMode)}
          />
        </SettingsSection>

         <SettingsSection title={t.dataAndPrivacy}>
           <SettingsButton
            label={t.manageOfflineData}
            icon={<Icons.CloudOff />}
            color={COLORS.amber}
            onClick={() => onNavigate('offline_manager')}
          />
        </SettingsSection>

        <SettingsSection title={t.about}>
            <SettingsButton
              label={t.aboutTheApp}
              icon={<Icons.Info />}
              color={COLORS.teal}
              onClick={() => onNavigate('launch_guide')}
            />
            <SettingsButton
              label={t.rateTheApp}
              icon={<Icons.Star />}
              color={COLORS.rose}
              onClick={() => {}}
            />
        </SettingsSection>

      </div>
    </div>
  );
};

const SettingsSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-8">
    <h3 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-3 px-4">{title}</h3>
    <div className="bg-white dark:bg-[#121820] rounded-[22px] border border-gray-200 dark:border-white/5">
      {children}
    </div>
  </div>
);

interface SettingsItemProps {
  label: string;
  icon: React.ReactNode;
  color: string;
}

const SettingsToggle: React.FC<SettingsItemProps & { isActive: boolean; onToggle: () => void }> = ({ label, icon, color, isActive, onToggle }) => (
  <div className="flex items-center p-4 border-b border-gray-100 dark:border-white/5 last:border-b-0">
    <div style={{ backgroundColor: color, color: '#FFF' }} className={`w-9 h-9 rounded-lg flex items-center justify-center`}>
      {icon}
    </div>
    <span className="ml-4 font-medium flex-1 text-gray-800 dark:text-gray-200">{label}</span>
    <button onClick={onToggle} className={`w-14 h-8 rounded-full flex items-center transition-colors ${isActive ? 'bg-blue-600' : 'bg-gray-200 dark:bg-white/10'}`}>
      <span className={`inline-block w-6 h-6 bg-white rounded-full transform transition-transform ${isActive ? 'translate-x-7' : 'translate-x-1'}`} />
    </button>
  </div>
);

const SettingsSelect: React.FC<SettingsItemProps & { options: {value: string, label: string}[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, icon, color, options, value, onChange }) => (
  <div className="flex items-center p-4 border-b border-gray-100 dark:border-white/5 last:border-b-0">
    <div style={{ backgroundColor: color, color: '#FFF' }} className={`w-9 h-9 rounded-lg flex items-center justify-center`}>
      {icon}
    </div>
    <span className="ml-4 font-medium flex-1 text-gray-800 dark:text-gray-200">{label}</span>
    <select value={value} onChange={onChange} className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-2 text-sm">
      {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
    </select>
  </div>
);

const SettingsButton: React.FC<SettingsItemProps & { onClick: () => void }> = ({ label, icon, color, onClick }) => (
  <button onClick={onClick} className="flex items-center p-4 w-full text-left border-b border-gray-100 dark:border-white/5 last:border-b-0">
    <div style={{ backgroundColor: color, color: '#FFF' }} className={`w-9 h-9 rounded-lg flex items-center justify-center`}>
      {icon}
    </div>
    <span className="ml-4 font-medium flex-1 text-gray-800 dark:text-gray-200">{label}</span>
    <div className="text-gray-400">
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6"/></svg>
    </div>
  </button>
);


export default Settings;
