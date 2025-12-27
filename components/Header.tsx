
import React from 'react';
import { Icons } from '../constants';

interface HeaderProps {
  isLoggedIn: boolean;
  userName: string | undefined;
  welcomeMessage: string;
  onSettingsClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ isLoggedIn, userName, welcomeMessage, onSettingsClick }) => {
  return (
    <div className="p-6 pt-14 flex justify-between items-center">
      <div>
        <p className="text-[13px] opacity-60 dark:opacity-40 font-medium mb-0.5">
          {isLoggedIn ? `Hola, ${userName}` : welcomeMessage}
        </p>
        <div className="flex items-center gap-2">
          <h1 className="text-[32px] font-black tracking-tight leading-tight">UrbanFlow<span className="text-blue-500">+</span></h1>
        </div>
      </div>
      <button onClick={onSettingsClick} className="w-11 h-11 bg-white dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white">
        <Icons.Settings />
      </button>
    </div>
  );
};

export default Header;
