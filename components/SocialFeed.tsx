import React from 'react';
import { SocialPost, Language } from '../types';
import { I18N, Icons } from '../constants';

interface SocialFeedProps {
  posts: SocialPost[];
  language: Language;
  onOpenReport?: () => void;
}

const SocialFeed: React.FC<SocialFeedProps> = ({ posts, language, onOpenReport }) => {
  const t = I18N[language];

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours}h`;
    return 'Hace 1d';
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-y-auto hide-scrollbar pb-32">
      <div className="p-8 pt-16">
        <h1 className="text-3xl font-black tracking-tight mb-2 italic uppercase">{t.social}</h1>
        <p className="text-sm opacity-40 font-medium mb-8">{t.cityFeed}</p>

        {/* Action Bar */}
        <div className="flex gap-4 mb-10 overflow-x-auto hide-scrollbar -mx-8 px-8">
          <button 
            onClick={onOpenReport}
            className="flex-shrink-0 bg-blue-600 text-white px-6 py-4 rounded-[24px] font-black text-xs uppercase flex items-center gap-3 shadow-xl shadow-blue-600/20 active:scale-95 transition-transform"
          >
            <Icons.Message /> Nuevo Reporte
          </button>
          <button className="flex-shrink-0 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/5 px-6 py-4 rounded-[24px] font-black text-xs uppercase flex items-center gap-3 text-gray-900 dark:text-white active:scale-95 transition-transform">
            <Icons.Users /> Amigos
          </button>
        </div>

        {/* Live Feed */}
        <div className="space-y-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white dark:bg-[#121820] rounded-[36px] p-6 border border-gray-200 dark:border-white/5 relative overflow-hidden group">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-lg text-white">
                  {post.userAvatar}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-bold text-sm text-gray-900 dark:text-white/90">{post.userName}</h3>
                    <span className="text-[10px] font-black opacity-30 uppercase text-gray-900 dark:text-white">{getTimeAgo(post.timestamp)}</span>
                  </div>
                  
                  {post.lineContext && (
                    <div className="inline-flex items-center gap-2 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full mb-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-[10px] font-black uppercase opacity-60 tracking-widest text-gray-900 dark:text-white">{post.lineContext}</span>
                    </div>
                  )}

                  <p className="text-sm font-medium leading-relaxed opacity-80 mb-4 text-gray-700 dark:text-white">
                    {post.content}
                  </p>

                  <div className="flex items-center gap-6">
                    <button className="flex items-center gap-2 text-xs font-black text-blue-500 active:scale-90 transition-transform">
                      <Icons.Heart /> {post.likes}
                    </button>
                    <button className="flex items-center gap-2 text-xs font-black opacity-30 active:scale-90 transition-transform text-gray-900 dark:text-white">
                      <Icons.Message /> Responder
                    </button>
                    <button className="ml-auto text-xs font-black opacity-30 text-gray-900 dark:text-white">
                      <Icons.Share />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Vibe Badge */}
              <div className={`absolute top-0 right-0 px-4 py-2 rounded-bl-3xl text-[8px] font-black uppercase tracking-widest ${
                post.type === 'alert' ? 'bg-red-500/20 text-red-600 dark:text-red-400' : 
                post.type === 'vibe' ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 
                'bg-blue-500/20 text-blue-600 dark:text-blue-400'
              }`}>
                {post.type}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialFeed;