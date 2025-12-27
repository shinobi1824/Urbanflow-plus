
import React from 'react';
import { Language } from '../types';
import { I18N, Icons } from '../constants';

interface FavoritesProps {
  onNavigate: (page: string) => void;
  language: Language;
}

const Favorites: React.FC<FavoritesProps> = ({ onNavigate, language }) => {
  const t = I18N[language];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-y-auto hide-scrollbar pb-28">
      <div className="p-6 pt-14 flex items-center">
        <button onClick={() => onNavigate('home')} className="p-3 bg-white/90 dark:bg-[#121820]/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-lg z-20">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
        </button>
        <h1 className="text-2xl font-black ml-4">{t.favorites}</h1>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <Icons.Star />
        <h2 className="text-xl font-bold mt-4">{t.noFavoritesTitle}</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2">{t.noFavoritesMessage}</p>
      </div>
    </div>
  );
};

export default Favorites;
