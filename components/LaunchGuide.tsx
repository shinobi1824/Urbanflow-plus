
import React from 'react';
import { Icons } from '../constants';

interface LaunchGuideProps {
  onClose: () => void;
}

const LaunchGuide: React.FC<LaunchGuideProps> = ({ onClose }) => {
  const steps = [
    {
      title: "1. API Keys de Transporte",
      desc: "Transitland API Conectada. Token seguro activo para datos GTFS-RT en tiempo real.",
      icon: <Icons.Database />,
      status: "Conectado"
    },
    {
      title: "2. Servidor de Mapas",
      desc: "Mapbox GL JS v3 activado con token público restringido. Renderizado 3D de edificios listo.",
      icon: <Icons.Globe />,
      status: "Listo"
    },
    {
      title: "3. Clima Dinámico",
      desc: "OpenWeatherMap conectada. Token activo para detección de lluvia y ajuste de rutas en tiempo real.",
      icon: <Icons.CloudRain />,
      status: "Conectado"
    },
    {
      title: "4. Despliegue (Producción)",
      desc: "UrbanFlow+ está listo. Metadatos PWA configurados para instalación nativa.",
      icon: <Icons.Send />,
      status: "Listo para Despegar 🚀"
    }
  ];

  return (
    <div className="h-full w-full bg-gray-50 dark:bg-[#0B0F14] text-gray-900 dark:text-white p-8 pt-16 flex flex-col overflow-y-auto hide-scrollbar">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black uppercase tracking-tighter italic">Guía de Producción</h1>
        <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-white/5 rounded-full">×</button>
      </div>

      <div className="bg-emerald-500 p-6 rounded-[32px] mb-8 shadow-2xl shadow-emerald-500/20 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="font-black text-lg mb-2">¡Sistemas al 100%!</h2>
          <p className="text-xs opacity-90 leading-relaxed font-medium">
            Has completado la integración de UrbanFlow+. La arquitectura está lista para competir globalmente.
          </p>
        </div>
        <div className="absolute -right-4 -bottom-4 text-9xl opacity-20 rotate-12">🚀</div>
      </div>

      <div className="space-y-4 mb-20">
        {steps.map((step, i) => (
          <div key={i} className="bg-white dark:bg-[#121820] border border-gray-200 dark:border-white/5 p-6 rounded-[28px] flex gap-5 shadow-sm dark:shadow-none">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${step.status.includes('Conectado') || step.status.includes('Listo') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-gray-100 dark:bg-white/5 text-blue-500'}`}>
              {step.icon}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <h3 className="font-bold text-sm">{step.title}</h3>
                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${step.status.includes('Conectado') || step.status.includes('Listo') ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 opacity-40'}`}>{step.status}</span>
              </div>
              <p className="text-[11px] opacity-50 leading-relaxed">{step.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <button onClick={onClose} className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-[24px] font-black uppercase tracking-widest text-xs mb-10">
        Entendido, Volver al Dashboard
      </button>
    </div>
  );
};

export default LaunchGuide;
