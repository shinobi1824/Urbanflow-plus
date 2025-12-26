
import { TransportMode } from "../types";

// API Key de OpenWeatherMap
const OPENWEATHER_API_KEY = 'ad0687f07bb2ab8e0f917ab95b05922b';

// Esta es la central de integraciones de UrbanFlow+
export const ExternalServices = {
  // 1. Integración con Ride-Hailing
  getRidePriceEstimate: async (mode: 'uber' | 'bolt' | '99', destination: string) => {
    // Simulación de llamada a API de terceros
    await new Promise(r => setTimeout(r, 800));
    const prices = { uber: 12.5, bolt: 10.2, '99': 9.8 };
    return prices[mode];
  },

  openRideApp: (mode: 'uber' | 'bolt' | '99', lat: number, lng: number) => {
    const urls = {
      uber: `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}`,
      bolt: `bolt://riderequest?dest_lat=${lat}&dest_lng=${lng}`,
      '99': `taxis99://riderequest?dest_lat=${lat}&dest_lng=${lng}`
    };
    window.location.href = urls[mode];
  },

  // 2. Integración con Clima
  getWeatherUpdate: async (lat: number, lng: number) => {
    // CONFIGURACIÓN DE PRODUCCIÓN:
    // Token inyectado. Descomentar para activar peticiones HTTP reales:
    // const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`);
    // const data = await res.json();
    
    // console.log(`[UrbanFlow+] Weather API Connected: ${OPENWEATHER_API_KEY.substring(0, 6)}...`);

    // Retorno simulado (Mock) para consistencia en demo
    return {
      temp: 24,
      condition: 'Clear',
      humidity: 0.6,
      willRainInNextHour: false
    };
  },

  // 3. Geocoding (Convertir texto a coordenadas reales)
  searchAddress: async (query: string) => {
    // Aquí iría la integración con Mapbox Geocoding o Google Places
    return {
      name: query,
      lat: -23.5615,
      lng: -46.6559 // Ejemplo: Av. Paulista
    };
  }
};
