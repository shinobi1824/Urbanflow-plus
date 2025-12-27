
import React, { useState, useEffect, useMemo } from 'react';
import { Language, AppState, UserPreferences, RouteResult, TransportMode, UserProfile, RouteFilter, SocialPost } from './types';
import { I18N, Icons, COLORS } from './constants';
import { parseNaturalLanguageQuery, generateSmartRoutes, getFallbackRoutes } from './services/gemini';
import { fetchNearbyAgencies, TransitEvents } from './services/transit';
import { ExternalServices } from './services/external';
import { auth, FirebaseService } from './services/firebase'; 
import { onAuthStateChanged } from 'firebase/auth';

import RouteList from './components/RouteList';
import MapPreview from './components/MapPreview';
import PremiumDashboard from './components/PremiumDashboard';
import Login from './components/Login';
import ImpactCenter from './components/ImpactCenter';
import SocialFeed from './components/SocialFeed';
import FloatingPIP from './components/FloatingPIP';
import ReportModal from './components/ReportModal';
import LaunchGuide from './components/LaunchGuide';
import Onboarding from './components/Onboarding';
import OfflineManager from './components/OfflineManager';
import AdBanner from './components/AdBanner';
import LocationPermissionModal from './components/LocationPermissionModal';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const hasOnboarded = localStorage.getItem('onboarded') === 'true';
    return {
      currentPage: hasOnboarded ? 'home' : 'onboarding',
      user: {
        theme: 'dark', 
        language: Language.ES,
        isPremium: false,
        accessibilityMode: false,
        extremeBatterySaver: false,
        safetyPriority: false,
        favorites: [],
        homeAddress: "",
        workAddress: "",
        offlineMode: false,
        offlineData: {},
      },
      auth: { isLoggedIn: false },
      origin: 'Ubicación Actual',
      destination: '',
      userLocation: undefined, // GPS
      searchResults: [],
      selectedRoute: undefined,
      selectedFilter: 'fastest',
      isLoading: false,
      isOnline: navigator.onLine,
      isDownloading: false,
      downloadProgress: 0,
      isNavigating: false,
      isSharingLive: false,
      nearbyAgencies: [],
      liveVehicles: [],
      liveArrivals: [],
      recentTrips: [],
      weather: { temp: 22, condition: 'Cloudy' },
      socialFeed: [
        { id: 'p1', userName: 'Mateo_Flow', userAvatar: 'M', type: 'alert', content: 'Metro L8 parado en estación Central.', likes: 12, lineContext: 'Metro L8', timestamp: Date.now() - 3600000 },
        { id: 'p2', userName: 'SaraUrbana', userAvatar: 'S', type: 'vibe', content: 'Hoy el transporte va fluido. ¡Buen viernes!', likes: 45, lineContext: 'G43', timestamp: Date.now() - 7200000 },
      ]
    };
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(true); // Control visibility of floating prompt
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);
  const t = I18N[state.user.language];

  // Theme Handling
  useEffect(() => {
    if (state.user.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.user.theme]);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: any) => {
      if (user) {
        const userProfile = await FirebaseService.syncUserProfile(user);
        setState(prev => ({
          ...prev,
          auth: { 
            isLoggedIn: true, 
            profile: {
              name: userProfile.name || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              initials: (user.email?.[0] || 'U').toUpperCase(),
              points: userProfile.points,
              level: userProfile.level,
              treesPlanted: 0,
              levelTitle: 'Explorador Urbano'
            }
          },
          user: { ...prev.user, isPremium: !!userProfile.isPremium }
        }));
      } else {
        setState(prev => ({ ...prev, auth: { isLoggedIn: false }, user: { ...prev.user, isPremium: false } }));
      }
    });
    return () => unsubscribe();
  }, []);

  // Check Permission State on Load
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((result) => {
        setPermissionStatus(result.state as any);
        if (result.state === 'granted') {
          handleGetLocation();
        }
      });
    } else {
      // Fallback for browsers not supporting permissions API
      handleGetLocation();
    }
  }, []);

  const handleGetLocation = async () => {
    if (!navigator.geolocation) {
      setToast({ message: "Geolocalización no soportada", type: 'error' });
      return;
    }

    // Only show toast if triggered manually or first load
    if (permissionStatus === 'prompt') {
       // setToast({ message: "Solicitando acceso GPS...", type: 'info' });
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setState(prev => ({
          ...prev,
          userLocation: { lat: latitude, lng: longitude },
          origin: "Mi Ubicación"
        }));
        setPermissionStatus('granted');
        setToast({ message: "Ubicación actualizada", type: 'success' });
        setShowLocationPrompt(false); // Hide prompt on success
        
        // Update weather based on real location
        ExternalServices.getWeatherUpdate(latitude, longitude).then(w => {
           setState(p => ({ ...p, weather: { temp: w.temp, condition: w.condition } }));
        });
      },
      (error) => {
        console.error("Error GPS:", error);
        if (error.code === 1) {
          setPermissionStatus('denied');
          // Don't show toast, let the floating modal handle the error UI
        } else {
          setToast({ message: "Error obteniendo señal GPS.", type: 'error' });
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setState(prev => ({ ...prev, isLoading: true, destination: query }));
    
    try {
      // 1. Parsear destino
      const parsed = await parseNaturalLanguageQuery(query);
      
      // 2. Clima actual
      const weather = await ExternalServices.getWeatherUpdate(state.userLocation?.lat || 0, state.userLocation?.lng || 0);
      
      let routes: RouteResult[] = [];

      // 3. Generar Rutas con IA usando Ubicación Real y Estado Premium
      routes = await generateSmartRoutes(
        parsed.destination || query, 
        weather, 
        state.userLocation,
        state.user.isPremium // <-- Pasamos el estado premium aquí
      );

      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        searchResults: routes, 
        currentPage: 'planner', 
        selectedRoute: routes[0], 
        weather: { temp: weather.temp, condition: weather.condition }
      }));

    } catch (error) {
      console.error("Search failed", error);
      setState(prev => ({ ...prev, isLoading: false }));
      setToast({ message: "Error buscando rutas. Intenta de nuevo.", type: 'info' });
    }
  };

  const handleVoiceSearch = () => { setToast({message: "Escuchando...", type: 'info'}); };
  const toggleTheme = () => setState(prev => ({ ...prev, user: { ...prev.user, theme: prev.user.theme === 'dark' ? 'light' : 'dark' } }));
  const startNavigation = (route: RouteResult) => setState(p => ({ ...p, selectedRoute: route, isNavigating: true, currentPage: 'navigation' }));
  const cancelRoute = () => setState(p => ({ ...p, selectedRoute: undefined, isNavigating: false, currentPage: 'planner', isSharingLive: false }));
  const toggleShareLive = () => { /* Same */ };
  const handlePremiumUpgrade = async () => { /* Same */ };

  const filteredRoutes = useMemo(() => {
    let routes = [...state.searchResults];
    if (routes.length === 0) return [];
    switch (state.selectedFilter) {
      case 'fastest': return routes.sort((a, b) => a.totalTime - b.totalTime);
      case 'cheapest': return routes.sort((a, b) => a.cost - b.cost);
      case 'less_walking': return routes.sort((a, b) => a.walkingDistance - b.walkingDistance);
      default: return routes;
    }
  }, [state.searchResults, state.selectedFilter]);

  const renderContent = () => {
    switch (state.currentPage) {
      case 'onboarding':
        return <Onboarding onComplete={() => {
          localStorage.setItem('onboarded', 'true');
          setState(p => ({ ...p, currentPage: 'home' }));
          handleGetLocation(); // Request explicitly after onboarding interaction
        }} />;

      case 'login':
        return <Login language={state.user.language} onLogin={() => {}} onSkip={() => setState(p => ({ ...p, currentPage: 'home' }))} />;

      case 'home':
        return (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-y-auto hide-scrollbar pb-40">
            <div className="p-6 pt-14 flex justify-between items-center">
              <div>
                <p className="text-[13px] opacity-60 dark:opacity-40 font-medium mb-0.5">
                  {state.auth?.isLoggedIn ? `Hola, ${state.auth.profile?.name}` : t.welcome}
                </p>
                <div className="flex items-center gap-2">
                   <h1 className="text-[32px] font-black tracking-tight leading-tight">UrbanFlow<span className="text-blue-500">+</span></h1>
                </div>
              </div>
              <button onClick={() => setState(p => ({ ...p, currentPage: 'settings' }))} className="w-11 h-11 bg-white dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white">
                <Icons.Settings />
              </button>
            </div>

            <div className="px-6 mb-6">
              <div className="bg-white dark:bg-[#121820] rounded-[22px] p-5 flex items-center border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-xl focus-within:border-blue-500/50 transition-all relative">
                {/* Location Status Dot / Button */}
                <button 
                   onClick={handleGetLocation}
                   className={`w-8 h-8 rounded-full mr-2 flex items-center justify-center transition-all active:scale-90 ${state.userLocation ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500 animate-pulse'}`}
                   title={state.userLocation ? "GPS Activo" : "Activar GPS"}
                >
                   {state.userLocation ? <Icons.Pin /> : <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><line x1="12" y1="8" x2="12" y2="16"/></svg>}
                </button>
                
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  className="bg-transparent w-full outline-none font-medium text-lg placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white" 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value); }} 
                />
                
                <button onClick={() => {}} className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform text-white shadow-lg bg-blue-600 shadow-blue-600/30`}>
                  <Icons.Mic />
                </button>
              </div>
            </div>

            <div className="px-6 mb-8 flex gap-3 overflow-x-auto hide-scrollbar">
               <QuickActionCard icon={<Icons.Home />} label={t.home} status dot />
               <QuickActionCard icon={<Icons.Work />} label={t.work} status />
               <QuickActionCard icon={<Icons.Star />} label={t.favorites} />
            </div>

            {!state.user.isPremium && <div className="px-6 mb-8"><AdBanner type="banner" /></div>}
            
            <div className="px-6 mb-8">
               <h2 className="text-xl font-black mb-4 text-gray-900 dark:text-white">{t.nearbyStops}</h2>
               {/* Render Nearby Agencies */}
               <div className="space-y-3">
                 <div className="bg-white dark:bg-[#121820] p-5 rounded-[28px] border border-gray-200 dark:border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500"><Icons.Bus /></div>
                       <div>
                         <h4 className="font-bold text-sm text-gray-900 dark:text-white">
                            {state.userLocation ? "Parada más cercana a ti" : "Ubicación desconocida"}
                         </h4>
                         <p className="text-[10px] opacity-60 dark:opacity-40 font-black uppercase text-gray-500 dark:text-gray-400">
                           {state.userLocation ? `${state.userLocation.lat.toFixed(4)}, ${state.userLocation.lng.toFixed(4)}` : "Toca el botón GPS arriba"}
                         </p>
                       </div>
                     </div>
                 </div>
               </div>
            </div>
          </div>
        );

      case 'social': return <SocialFeed posts={state.socialFeed} language={state.user.language} />;

      case 'planner':
        return (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-hidden">
            <div className="h-[30%] w-full relative">
              {/* Pass userLocation to MapPreview so it centers correctly */}
              <MapPreview 
                selectedRoute={state.selectedRoute} 
                theme={state.user.theme} 
                userLocation={state.userLocation} 
              />
              <button onClick={() => setState(p => ({ ...p, currentPage: 'home', selectedRoute: undefined }))} className="absolute top-14 left-6 p-3 bg-white/90 dark:bg-[#121820]/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-lg z-20">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar pb-32">
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar -mx-6 px-6 py-2">
                <FilterChip label={t.fastest} active={state.selectedFilter === 'fastest'} onClick={() => setState(p => ({ ...p, selectedFilter: 'fastest' }))} />
                <FilterChip label={t.cheapest} active={state.selectedFilter === 'cheapest'} onClick={() => setState(p => ({ ...p, selectedFilter: 'cheapest' }))} />
              </div>
              
              <RouteList 
                routes={filteredRoutes} 
                onSelect={(route) => setState(p => ({ ...p, selectedRoute: route }))} 
                onNavigate={startNavigation}
                onCancel={cancelRoute}
                language={state.user.language} 
                activeFilter={state.selectedFilter}
                selectedRouteId={state.selectedRoute?.id}
                isPremiumUser={state.user.isPremium} 
              />
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white">
            <div className="flex-1 relative">
              <MapPreview selectedRoute={state.selectedRoute} theme={state.user.theme} userLocation={state.userLocation} />
              {/* Navigation UI elements */}
              <button onClick={() => setState(p => ({ ...p, currentPage: 'home' }))} className="absolute top-14 left-6 p-4 bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-full shadow-2xl z-50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white">
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
              </button>
            </div>
            {/* Steps panel remains same as before */}
            <div className="h-1/2 bg-white dark:bg-[#121820] rounded-t-[48px] p-8 shadow-3xl overflow-y-auto relative">
                {/* ... existing navigation panel code ... */}
                <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-4">{state.selectedRoute?.endTime}</h2>
                <div className="space-y-6">
                 {state.selectedRoute?.steps.map((step, idx) => (
                   <div key={idx} className="flex gap-5">
                     <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center text-blue-500">
                       {step.mode === TransportMode.BUS ? <Icons.Bus /> : <Icons.Walk />}
                     </div>
                     <div className="flex-1 border-b border-gray-100 dark:border-white/5 pb-4">
                       <p className="text-base font-bold leading-tight text-gray-900 dark:text-white">{step.instruction}</p>
                       <p className="text-[10px] opacity-40 font-black uppercase mt-1 text-gray-500 dark:text-gray-400">{step.durationMinutes} MIN</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        );
      
      case 'impact': return <ImpactCenter state={state} />;
      case 'premium': return <PremiumDashboard user={state.user} language={state.user.language} onUpgrade={handlePremiumUpgrade} />;
      case 'launch_guide': return <LaunchGuide onClose={() => setState(p => ({ ...p, currentPage: 'home' }))} />;
      case 'offline_manager': return <OfflineManager onClose={() => setState(p => ({ ...p, currentPage: 'settings' }))} />;
      case 'settings':
         // Simplified settings for brevity
         return <div className="p-8"><h1 className="text-2xl">Ajustes</h1><button onClick={() => setState(p => ({...p, currentPage: 'home'}))}>Volver</button></div>;

      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen relative bg-gray-50 dark:bg-[#0B0F14] overflow-hidden flex flex-col shadow-2xl">
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
        {state.isNavigating && state.currentPage !== 'navigation' && state.selectedRoute && (
          <FloatingPIP route={state.selectedRoute} onExpand={() => setState(p => ({ ...p, currentPage: 'navigation' }))} onClose={cancelRoute} />
        )}
        {showReportModal && <ReportModal onClose={() => setShowReportModal(false)} onReport={() => setShowReportModal(false)} />}
      </main>

      {/* Location Permission Floating Modal */}
      {!state.userLocation && showLocationPrompt && state.currentPage !== 'onboarding' && (
        <LocationPermissionModal 
          status={permissionStatus} 
          onRequest={handleGetLocation} 
          onDismiss={() => setShowLocationPrompt(false)}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[1000] px-6 py-4 rounded-3xl shadow-2xl border flex items-center gap-3 animate-[slideInToast_0.3s_ease-out] ${
          toast.type === 'error' ? 'bg-red-600 border-red-400 text-white' : 
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-blue-600 border-blue-400 text-white'
        }`}>
          <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
        </div>
      )}

      {/* Bottom Nav */}
      {state.currentPage !== 'onboarding' && state.currentPage !== 'login' && !['navigation', 'launch_guide', 'offline_manager'].includes(state.currentPage) && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-[92px] border-t border-gray-200 dark:border-white/5 bg-white/90 dark:bg-[#0B0F14]/90 backdrop-blur-xl flex items-center justify-around px-8 z-50 rounded-t-[40px]">
          <NavButton active={state.currentPage === 'home'} onClick={() => setState(p => ({ ...p, currentPage: 'home' }))} icon={<Icons.Home />} label={t.navHome} />
          <NavButton active={state.currentPage === 'social'} onClick={() => setState(p => ({ ...p, currentPage: 'social' }))} icon={<Icons.Users />} label={t.social} />
          <NavButton active={state.currentPage === 'impact'} onClick={() => setState(p => ({ ...p, currentPage: 'impact' }))} icon={<Icons.Trophy />} label={t.impact} />
          <NavButton active={state.currentPage === 'settings' || state.currentPage === 'premium'} onClick={() => setState(p => ({ ...p, currentPage: 'settings' }))} icon={<Icons.Settings />} label={t.navSettings} />
        </nav>
      )}

      {state.isLoading && (
        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-[#0B0F14]/80 backdrop-blur-md">
           <div className="text-center p-12 bg-white dark:bg-[#1a1f26] rounded-[60px] border border-gray-200 dark:border-white/10 shadow-3xl">
             <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-8"></div>
             <p className="font-black text-2xl tracking-tighter uppercase italic text-gray-900 dark:text-white">Generando Ruta</p>
             <p className="text-[10px] font-bold opacity-30 mt-2 tracking-widest text-gray-500 dark:text-white">CALCULANDO DESDE TU GPS...</p>
           </div>
        </div>
      )}
      <style>{`
        @keyframes slideInToast {
          from { transform: translate(-50%, -100%); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Subcomponents helper
const QuickActionCard = ({ icon, label, dot }: any) => (
  <button className="flex-shrink-0 w-[95px] h-[140px] bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/5 rounded-[28px] flex flex-col items-center justify-center p-4 gap-4 active:scale-95 transition-all relative shadow-sm dark:shadow-none">
    {dot && <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
    <div className="text-gray-900 dark:text-white opacity-60">{icon}</div>
    <span className="text-[12px] font-bold text-center leading-tight opacity-60 text-gray-900 dark:text-white">{label}</span>
  </button>
);

const NavButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center transition-all ${active ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500'}`}>
    <div className={`p-2 rounded-2xl transition-all ${active ? 'bg-blue-500/10' : ''}`}>{icon}</div>
    <span className="text-[9px] font-black uppercase mt-1 tracking-widest">{label}</span>
  </button>
);

const FilterChip = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex-shrink-0 px-6 py-3 rounded-full border transition-all font-bold text-xs ${active ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white dark:bg-[#121820] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}>
    {label}
  </button>
);

export default App;
