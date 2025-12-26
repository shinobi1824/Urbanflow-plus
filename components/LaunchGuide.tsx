
import React from 'react';
import { Icons } from '../constants';

interface LaunchGuideProps {
  onClose: () => void;
}

const LaunchGuide: React.FC<LaunchGuideProps> = ({ onClose }) => {
  const steps = [
    {
      title: "1. Core de Transporte (GTFS)",
      desc: "Transitland API conectada. Datos de tránsito multimodal y horarios en tiempo real sincronizados.",
      icon: <Icons.Bus />,
      status: "Conectado ✅"
    },
    {
      title: "2. Motor Espacial (Mapbox)",
      desc: "Mapbox GL JS v3 activado. Renderizado vectorial 3D y navegación optimizada.",
      icon: <Icons.Globe />,
      status: "Listo ✅"
    },
    {
      title: "3. Backend Cloud (Firebase)",
      desc: "Auth, Firestore y Analytics activos (urbanflow-plus-db62f). Persistencia de usuarios y favoritos.",
      icon: <Icons.Database />,
      status: "Sincronizado ✅"
    },
    {
      title: "4. Inteligencia Artificial (Gemini)",
      desc: "Modelos Generativos configurados para optimización de rutas y razonamiento de lenguaje natural.",
      icon: <Icons.Bolt />,
      status: "Activo ✅"
    },
    {
      title: "5. Monetización (AdMob)",
      desc: "Lógica híbrida implementada. Fallback Web activo y soporte nativo @capacitor/admob preparado.",
      icon: <Icons.Star />,
      status: "Configurado ⚠️"
    },
    {
      title: "6. Despliegue Nativo (Capacitor)",
      desc: "Listo para 'npm run android'. Requiere generar assets (iconos/splash) antes de subir a Stores.",
      icon: <Icons.Send />,
      status: "Pendiente Build 🚀"
    }
  ];

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white p-8 pt-16 flex flex-col overflow-y-auto hide-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">Roadmap Técnico</h1>
        <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-white/5 rounded-full">×</button>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-[32px] mb-8 shadow-2xl shadow-blue-600/20 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-black text-lg mb-2">Arquitectura Escalable</h2>
          <p className="text-xs opacity-90 leading-relaxed font-medium">
            UrbanFlow+ integra ahora Firebase Auth y DB con Gemini AI. La infraestructura está lista para competir con Moovit.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 text-9xl opacity-20 rotate-12">🏗️</div>
      </div>

      <div className="space-y-4 mb-20">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/5 p-6 rounded-[28px] flex gap-5 shadow-sm dark:shadow-none items-start">
            <div className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center ${step.status.includes('✅') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'}`}>
              {step.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-sm leading-tight">{step.title}</h3>
              </div>
              <p className="text-[11px] opacity-60 leading-relaxed mb-2">{step.desc}</p>
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md ${
                step.status.includes('✅') ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 
                step.status.includes('🚀') ? 'bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
              }`}>
                {step.status}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onClose} className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[24px] font-black uppercase tracking-widest text-xs mb-10 shadow-lg active:scale-95 transition-transform">
        Volver al Dashboard
      </button>
    </div>
  );
};

export default LaunchGuide;
