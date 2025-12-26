
import React, { useState, useEffect, useMemo } from 'react';
import { Language, AppState, UserPreferences, RouteResult, TransportMode, UserProfile, RouteFilter, SocialPost } from './types';
import { I18N, Icons, COLORS } from './constants';
import { parseNaturalLanguageQuery, generateSmartRoutes, getFallbackRoutes } from './services/gemini';
import { fetchNearbyAgencies, TransitEvents } from './services/transit';
import { ExternalServices } from './services/external';
import { auth, FirebaseService } from './services/firebase'; // Importar Firebase
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

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const hasOnboarded = localStorage.getItem('onboarded') === 'true';
    return {
      currentPage: hasOnboarded ? 'home' : 'onboarding',
      user: {
        theme: 'dark', // Default to dark, can be toggled
        language: Language.ES,
        isPremium: false,
        accessibilityMode: false,
        extremeBatterySaver: false,
        safetyPriority: false,
        favorites: [],
        homeAddress: "Av. Paulista, 1578",
        workAddress: "TransMilenio Portal Norte",
        offlineMode: false,
        offlineData: {},
      },
      auth: { isLoggedIn: false },
      origin: 'Current Location',
      destination: '',
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
      recentTrips: [
        { id: '1', name: 'Parque Ibirapuera', address: 'Av. Pedro Álvares Cabral' },
        { id: '2', name: 'Metro CDMX Zócalo', address: 'Plaza de la Constitución' }
      ],
      weather: { temp: 22, condition: 'Rainy' },
      socialFeed: [
        { id: 'p1', userName: 'Mateo_Flow', userAvatar: 'M', type: 'alert', content: 'Metro L8 parado en estación Central. Mejor tomen el Bus 21.', likes: 12, lineContext: 'Metro L8' },
        { id: 'p2', userName: 'SaraUrbana', userAvatar: 'S', type: 'vibe', content: 'Hoy el TransMilenio va vacío y con música chill. ¡Buen viernes!', likes: 45, lineContext: 'TM G43' },
        { id: 'p3', userName: 'BikeLover', userAvatar: 'B', type: 'tip', content: 'Nueva ciclovía habilitada en Calle 100. Muy segura.', likes: 8, lineContext: 'Ciclovía' },
      ]
    };
  });

  const [showReportModal, setShowReportModal] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' } | null>(null);
  const t = I18N[state.user.language];

  // Theme Handling
  useEffect(() => {
    if (state.user.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.user.theme]);

  // Listener de Autenticación Firebase Real
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Usuario logueado: Traer datos de Firestore
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
              level: userProfile.level
            }
          },
          user: {
            ...prev.user,
            isPremium: !!userProfile.isPremium,
            // Cargar preferencias guardadas si existieran
          }
        }));
        setToast({ message: `Hola de nuevo, ${user.email?.split('@')[0]}`, type: 'success' });
      } else {
        // Usuario desconectado
        setState(prev => ({ 
          ...prev, 
          auth: { isLoggedIn: false },
          user: { ...prev.user, isPremium: false } 
        }));
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const agencies = await fetchNearbyAgencies(0, 0);
        setState(p => ({ ...p, nearbyAgencies: agencies }));
      } catch (e) {
        console.error("Failed to load agencies", e);
      }
    };
    loadData();

    const handleOnline = () => setState(p => ({ ...p, isOnline: true }));
    const handleOffline = () => setState(p => ({ ...p, isOnline: false }));
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const toggleTheme = () => {
    setState(prev => ({
      ...prev,
      user: { ...prev.user, theme: prev.user.theme === 'dark' ? 'light' : 'dark' }
    }));
  };

  const handlePremiumUpgrade = async () => {
    setToast({ message: "Procesando pago seguro...", type: 'info' });
    
    // Simular latencia de pago
    await new Promise(r => setTimeout(r, 2000));
    
    if (auth.currentUser) {
      // Guardar en Firebase Real
      await FirebaseService.upgradeToPremium(auth.currentUser.uid);
      
      setState(prev => ({
        ...prev,
        user: { ...prev.user, isPremium: true }
      }));
      setToast({ message: "¡Compra exitosa! Premium activado en la nube.", type: 'success' });
    } else {
      // Usuario invitado (solo local)
      setState(prev => ({
        ...prev,
        user: { ...prev.user, isPremium: true }
      }));
      setToast({ message: "¡Bienvenido a UrbanFlow+ Premium!", type: 'success' });
    }
  };

  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setToast({ message: "Tu dispositivo no soporta voz", type: 'info' });
      return;
    }

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = state.user.language === Language.EN ? 'en-US' : state.user.language === Language.PT ? 'pt-BR' : 'es-ES';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setToast({ message: "Escuchando...", type: 'info' });
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setToast({ message: `Buscando: ${transcript}`, type: 'success' });
      handleSearch(transcript);
    };

    recognition.onerror = () => setToast({ message: "No te entendí, intenta de nuevo", type: 'info' });
    
    recognition.start();
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setState(prev => ({ ...prev, isLoading: true, destination: query }));
    
    try {
      // 1. Interpretar Intención (IA - Disponible para todos para saber destino)
      const parsed = await parseNaturalLanguageQuery(query);
      
      // 2. Obtener Clima Real
      const weather = await ExternalServices.getWeatherUpdate(0, 0);
      
      let routes: RouteResult[] = [];

      // 3. LOGICA PREMIUM: Bloquear IA Generativa si no paga
      if (state.user.isPremium) {
        // Usuario Paga: Rutas Inteligentes con Gemini
        routes = await generateSmartRoutes(parsed.destination || query, weather);
      } else {
        // Usuario Gratis: Rutas Estándar (Fallback)
        await new Promise(r => setTimeout(r, 1000));
        routes = getFallbackRoutes(parsed.destination || query);
        setToast({ message: "Modo Gratuito: IA desactivada", type: 'info' });
      }

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
      setToast({ message: "Error buscando rutas", type: 'info' });
    }
  };

  const startNavigation = (route: RouteResult) => {
    setState(p => ({ ...p, selectedRoute: route, isNavigating: true, currentPage: 'navigation' }));
  };

  const cancelRoute = () => {
    setState(p => ({ 
      ...p, 
      selectedRoute: undefined, 
      isNavigating: false, 
      currentPage: 'planner',
      isSharingLive: false 
    }));
    setToast({ message: "Ruta cancelada", type: 'info' });
  };

  const toggleShareLive = () => {
    const isNowSharing = !state.isSharingLive;
    setState(p => ({ ...p, isSharingLive: isNowSharing }));
    if (isNowSharing) {
      setToast({ message: "Enlace copiado • Compartiendo en vivo", type: 'success' });
    } else {
      setToast({ message: "Se detuvo el seguimiento en vivo", type: 'info' });
    }
  };

  const filteredRoutes = useMemo(() => {
    let routes = [...state.searchResults];
    if (routes.length === 0) return [];
    
    switch (state.selectedFilter) {
      case 'fastest': return routes.sort((a, b) => a.totalTime - b.totalTime);
      case 'cheapest': return routes.sort((a, b) => a.cost - b.cost);
      case 'less_walking': return routes.sort((a, b) => a.walkingDistance - b.walkingDistance);
      case 'less_transfers': return routes.sort((a, b) => a.transfers - b.transfers);
      case 'accessible': return routes.filter(r => r.isAccessible);
      default: return routes;
    }
  }, [state.searchResults, state.selectedFilter]);

  const renderContent = () => {
    switch (state.currentPage) {
      case 'onboarding':
        return <Onboarding onComplete={() => {
          localStorage.setItem('onboarded', 'true');
          setState(p => ({ ...p, currentPage: 'home' }));
        }} />;

      case 'login':
        return <Login 
          language={state.user.language} 
          onLogin={() => { /* Manejado por onAuthStateChanged */ }} 
          onSkip={() => setState(p => ({ ...p, currentPage: 'home' }))} 
        />;

      case 'home':
        return (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-y-auto hide-scrollbar pb-40">
            <div className="p-6 pt-14 flex justify-between items-center">
              <div>
                <p className="text-[13px] opacity-60 dark:opacity-40 font-medium mb-0.5">
                  {state.auth?.isLoggedIn ? `Hola, ${state.auth.profile?.name}` : t.welcome}
                </p>
                <h1 className="text-[32px] font-black tracking-tight leading-tight">UrbanFlow<span className="text-blue-500">+</span></h1>
              </div>
              <button onClick={() => setState(p => ({ ...p, currentPage: 'settings' }))} className="w-11 h-11 bg-white dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 flex items-center justify-center text-gray-900 dark:text-white">
                <Icons.Settings />
              </button>
            </div>

            {/* Login CTA for Guest */}
            {!state.auth?.isLoggedIn && (
               <div className="px-6 mb-6">
                 <div onClick={() => setState(p => ({ ...p, currentPage: 'login' }))} className="bg-gradient-to-r from-gray-900 to-black dark:from-white dark:to-gray-200 p-4 rounded-3xl flex items-center justify-between shadow-xl cursor-pointer">
                    <div className="text-white dark:text-black">
                      <p className="font-bold text-sm">Sincroniza tus viajes</p>
                      <p className="text-[10px] opacity-70">Guarda favoritos y gana puntos</p>
                    </div>
                    <div className="bg-white dark:bg-black text-black dark:text-white px-4 py-2 rounded-full text-[10px] font-black uppercase">Login</div>
                 </div>
               </div>
            )}

            <div className="px-6 mb-6">
              <div className="bg-white dark:bg-[#121820] rounded-[22px] p-5 flex items-center border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-xl focus-within:border-blue-500/50 transition-all">
                <input 
                  type="text" 
                  placeholder={t.searchPlaceholder} 
                  className="bg-transparent w-full outline-none font-medium text-lg placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white" 
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch((e.target as HTMLInputElement).value); }} 
                />
                <button 
                  onClick={handleVoiceSearch}
                  className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform text-white shadow-lg ${state.user.isPremium ? 'bg-gradient-to-r from-indigo-500 to-purple-500 shadow-purple-500/30' : 'bg-blue-600 shadow-blue-600/30'}`}
                >
                  <Icons.Mic />
                </button>
              </div>
              {!state.user.isPremium && (
                <div className="mt-2 text-center">
                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">IA Smart Routing: Bloqueado 🔒</span>
                </div>
              )}
            </div>

            <div className="px-6 mb-8">
               <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-3xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="animate-pulse">⚠️</span>
                    <p className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-500 tracking-widest">LatAm Live: Reportes en tiempo real activados</p>
                  </div>
                  <button onClick={() => setShowReportModal(true)} className="text-[10px] font-black underline opacity-60 dark:opacity-40 uppercase text-gray-900 dark:text-white">Reportar</button>
               </div>
            </div>

            <div className="px-6 mb-8 flex gap-3 overflow-x-auto hide-scrollbar">
               <QuickActionCard icon={<Icons.Home />} label={t.home} status dot />
               <QuickActionCard icon={<Icons.Work />} label={t.work} status />
               <QuickActionCard icon={<Icons.Star />} label={t.favorites} />
            </div>

            {/* Espacio para Publicidad Nativa */}
            {!state.user.isPremium && (
              <div className="px-6 mb-8">
                 <AdBanner type="banner" />
              </div>
            )}

            <div className="px-6 mb-8">
               <h2 className="text-xl font-black mb-4 text-gray-900 dark:text-white">{t.nearbyStops}</h2>
               <div className="space-y-3">
                 {state.nearbyAgencies.slice(0, 3).map(agency => (
                   <div key={agency.id} className="bg-white dark:bg-[#121820] p-5 rounded-[28px] border border-gray-200 dark:border-white/5 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm dark:shadow-none">
                     <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                         {agency.id.includes('metro') || agency.id.includes('subte') ? <Icons.Metro /> : <Icons.Bus />}
                       </div>
                       <div>
                         <h4 className="font-bold text-sm text-gray-900 dark:text-white">{agency.name}</h4>
                         <p className="text-[10px] opacity-60 dark:opacity-40 font-black uppercase text-gray-500 dark:text-gray-400">{agency.region} • {agency.countryCode}</p>
                       </div>
                     </div>
                     <span className="text-[10px] font-black text-blue-500 uppercase">En Vivo</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        );

      case 'social':
        return <SocialFeed posts={state.socialFeed} language={state.user.language} />;

      case 'planner':
        return (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white overflow-hidden">
            <div className="h-[30%] w-full relative">
              <MapPreview selectedRoute={state.selectedRoute} theme={state.user.theme} />
              <button onClick={() => setState(p => ({ ...p, currentPage: 'home', selectedRoute: undefined }))} className="absolute top-14 left-6 p-3 bg-white/90 dark:bg-[#121820]/80 backdrop-blur-md rounded-full border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white shadow-lg">
                <Icons.Clock />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 hide-scrollbar pb-32">
              <div className="flex gap-2.5 overflow-x-auto hide-scrollbar -mx-6 px-6 py-2">
                <FilterChip label={t.fastest} active={state.selectedFilter === 'fastest'} onClick={() => setState(p => ({ ...p, selectedFilter: 'fastest' }))} />
                <FilterChip label={t.cheapest} active={state.selectedFilter === 'cheapest'} onClick={() => setState(p => ({ ...p, selectedFilter: 'cheapest' }))} />
                <FilterChip label={t.lessWalking} active={state.selectedFilter === 'less_walking'} onClick={() => setState(p => ({ ...p, selectedFilter: 'less_walking' }))} />
              </div>
              
              {!state.user.isPremium ? (
                 <>
                   <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl text-white shadow-lg mb-4 cursor-pointer" onClick={() => setState(p => ({ ...p, currentPage: 'premium' }))}>
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-[10px] font-black uppercase opacity-70 mb-1">Mejora a Premium</p>
                            <p className="font-bold text-sm">Desbloquea rutas IA + Sin Anuncios</p>
                         </div>
                         <div className="text-2xl">🔒</div>
                      </div>
                   </div>
                   <AdBanner type="banner" />
                 </>
              ) : (
                <div className="flex items-center gap-2 mb-2">
                   <span className="text-xs font-black uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">✨ AI Powered Routing Active</span>
                </div>
              )}
              
              <RouteList 
                routes={filteredRoutes} 
                onSelect={(route) => setState(p => ({ ...p, selectedRoute: route }))} 
                onNavigate={startNavigation}
                onCancel={cancelRoute}
                language={state.user.language} 
                activeFilter={state.selectedFilter}
                selectedRouteId={state.selectedRoute?.id}
              />
            </div>
          </div>
        );

      case 'navigation':
        return (
          <div className="flex flex-col h-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white">
            <div className="flex-1 relative">
              <MapPreview selectedRoute={state.selectedRoute} theme={state.user.theme} />
              <button 
                onClick={() => setState(p => ({ ...p, currentPage: 'home' }))} 
                className="absolute top-14 left-6 p-4 bg-white/90 dark:bg-white/10 backdrop-blur-md rounded-full shadow-2xl z-50 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white active:scale-95 transition-transform"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7"/></svg>
              </button>
              
              {state.isSharingLive && (
                <div className="absolute top-14 right-6 bg-emerald-500/90 backdrop-blur-md px-4 py-2 rounded-2xl flex items-center gap-3 border border-emerald-400/30 animate-pulse shadow-xl z-50">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Compartiendo en Vivo</span>
                </div>
              )}
            </div>
            <div className="h-1/2 bg-white dark:bg-[#121820] rounded-t-[48px] p-8 shadow-3xl overflow-y-auto relative">
               <button 
                onClick={() => setShowReportModal(true)}
                className="absolute top-6 right-8 w-12 h-12 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl flex items-center justify-center text-orange-500"
               >
                 <Icons.Shield />
               </button>

               <div className="flex justify-between items-start mb-8 pr-14">
                 <div>
                   <h2 className="text-4xl font-black text-gray-900 dark:text-white">{state.selectedRoute?.endTime}</h2>
                   <p className="text-emerald-600 dark:text-emerald-500 font-bold text-xs uppercase tracking-widest mt-1">Destino: {state.destination}</p>
                 </div>
                 <div className="text-right">
                    <span className="text-5xl font-black text-blue-500">{state.selectedRoute?.totalTime}</span>
                    <span className="text-xs font-bold opacity-30 ml-1 uppercase text-gray-900 dark:text-white">min</span>
                 </div>
               </div>
               
               <div className="space-y-6 mb-12">
                 {state.selectedRoute?.steps.map((step, idx) => (
                   <div key={idx} className="flex gap-5">
                     <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/5 flex items-center justify-center text-blue-500">
                       {step.mode === TransportMode.BUS ? <Icons.Bus /> : <Icons.Walk />}
                     </div>
                     <div className="flex-1 border-b border-gray-100 dark:border-white/5 pb-4">
                       <p className="text-base font-bold leading-tight text-gray-900 dark:text-white">{step.instruction}</p>
                       <p className="text-[10px] opacity-40 font-black uppercase mt-1 text-gray-500 dark:text-gray-400">{step.durationMinutes} MIN • {step.lineName || 'Trayecto a pie'}</p>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="flex gap-3 mt-4 mb-10">
                 <button 
                   onClick={() => {
                     if (!state.isSharingLive) {
                       navigator.clipboard.writeText(`https://urbanflow.plus/track/${state.selectedRoute?.id}`);
                     }
                     toggleShareLive();
                   }}
                   className={`flex-1 py-5 rounded-[28px] font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 transition-all active:scale-95 ${
                     state.isSharingLive 
                       ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-lg' 
                       : 'bg-blue-600 text-white shadow-blue-600/20 shadow-lg'
                   }`}
                 >
                   <Icons.Share />
                   {state.isSharingLive ? 'Dejar de compartir' : 'Compartir Ruta'}
                 </button>
                 
                 <button 
                   onClick={cancelRoute}
                   className="w-[35%] py-5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-[28px] font-black uppercase tracking-widest text-[11px] active:scale-95 transition-transform"
                 >
                   Salir
                 </button>
               </div>
            </div>
          </div>
        );

      case 'impact': return <ImpactCenter state={state} />;
      case 'premium': 
        return (
           <PremiumDashboard 
              user={state.user} 
              language={state.user.language} 
              onUpgrade={handlePremiumUpgrade}
           />
        );
      case 'launch_guide': return <LaunchGuide onClose={() => setState(p => ({ ...p, currentPage: 'home' }))} />;
      case 'offline_manager': return <OfflineManager onClose={() => setState(p => ({ ...p, currentPage: 'settings' }))} />;
      
      case 'settings':
        return (
          <div className="p-8 pt-16 h-full flex flex-col bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white">
            <h1 className="text-3xl font-black mb-10 tracking-tighter uppercase italic">Ajustes</h1>
            <div className="space-y-3">
               <SettingsItem icon={<Icons.Globe />} label="Idioma" value="Español" />
               <SettingsItem icon={<Icons.Bolt />} label="Tema" value={state.user.theme === 'dark' ? 'Oscuro' : 'Claro'} onClick={toggleTheme} />
               <SettingsItem icon={<Icons.CloudOff />} label="Mapas Offline" onClick={() => setState(p => ({ ...p, currentPage: 'offline_manager' }))} />
               {state.user.isPremium ? (
                  <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-[32px] flex items-center justify-between shadow-xl">
                     <span className="font-bold text-white text-sm">Plan Premium Activo</span>
                     <Icons.Star />
                  </div>
               ) : (
                  <SettingsItem icon={<Icons.Star />} label="Obtener Premium" onClick={() => setState(p => ({ ...p, currentPage: 'premium' }))} />
               )}
               {state.auth?.isLoggedIn && (
                 <SettingsItem 
                    icon={<div className="text-red-500"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg></div>}
                    label="Cerrar Sesión" 
                    onClick={() => auth.signOut()} 
                 />
               )}
               <SettingsItem icon={<Icons.Database />} label="Guía de Producción" dev onClick={() => setState(p => ({ ...p, currentPage: 'launch_guide' }))} />
            </div>
            <button onClick={() => setState(p => ({ ...p, currentPage: 'home' }))} className="mt-auto py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-widest text-[10px]">Cerrar</button>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="max-w-md mx-auto h-screen relative bg-gray-50 dark:bg-[#0B0F14] overflow-hidden flex flex-col shadow-2xl">
      <main className="flex-1 overflow-hidden relative">
        {renderContent()}
        
        {/* PIP Floating Navigation */}
        {state.isNavigating && state.currentPage !== 'navigation' && state.selectedRoute && (
          <FloatingPIP 
            route={state.selectedRoute} 
            onExpand={() => setState(p => ({ ...p, currentPage: 'navigation' }))}
            onClose={cancelRoute}
          />
        )}

        {showReportModal && (
          <ReportModal 
            onClose={() => setShowReportModal(false)} 
            onReport={(t) => { 
              if (t === 'share_live') {
                toggleShareLive();
                setShowReportModal(false);
              } else {
                alert(`Reporte enviado: ${t}`); 
                setShowReportModal(false); 
              }
            }} 
            isSharing={state.isSharingLive}
            language={state.user.language}
          />
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-12 left-1/2 -translate-x-1/2 z-[1000] px-6 py-4 rounded-3xl shadow-2xl border flex items-center gap-3 animate-[slideInToast_0.3s_ease-out] ${
          toast.type === 'success' ? 'bg-emerald-600 border-emerald-400 text-white' : 'bg-blue-600 border-blue-400 text-white'
        }`}>
          <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
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
             <p className="font-black text-2xl tracking-tighter uppercase italic text-gray-900 dark:text-white">Urban Engine</p>
             <p className="text-[10px] font-bold opacity-30 mt-2 tracking-widest text-gray-500 dark:text-white">
               {state.user.isPremium ? "OPTIMIZANDO CON GEMINI AI..." : "BUSCANDO RUTAS..."}
             </p>
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

const SettingsItem = ({ icon, label, value, dev, onClick }: any) => (
  <button onClick={onClick} className="w-full p-6 bg-white dark:bg-[#121820] rounded-[32px] border border-gray-200 dark:border-white/5 flex items-center justify-between active:scale-[0.98] transition-all shadow-sm dark:shadow-none">
    <div className="flex items-center gap-4">
      <div className="text-blue-500 opacity-60">{icon}</div>
      <span className="font-bold text-sm text-gray-900 dark:text-white">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {value && <span className="text-xs font-bold opacity-40 text-gray-500 dark:text-white">{value}</span>}
      {dev && <span className="text-[8px] font-black uppercase bg-blue-500 text-white px-2 py-0.5 rounded-full">DEV</span>}
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" className="opacity-20 text-gray-900 dark:text-white"><path d="M9 18l6-6-6-6"/></svg>
    </div>
  </button>
);

const FilterChip = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`flex-shrink-0 px-6 py-3 rounded-full border transition-all font-bold text-xs ${active ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-white dark:bg-[#121820] border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400'}`}>
    {label}
  </button>
);

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

export default App;
