
import { TransportMode } from "../types";

// API Key de OpenWeatherMap
const OPENWEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || '';

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
    // Aquí iría la integración real con Mapbox Geocoding o Google Places
    // Para la demo, devolvemos coordenadas fijas pero con una pequeña variación aleatoria
    // para simular destinos distintos cerca de Av. Paulista.
    return {
      name: query,
      lat: -23.5615 + (Math.random() * 0.02 - 0.01),
      lng: -46.6559 + (Math.random() * 0.02 - 0.01)
    };
  },

  // 4. Escritura Predictiva (Autocompletado Mock)
  getPredictions: async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) return [];
    
    await new Promise(r => setTimeout(r, 200)); // Latencia simulada
    
    // Base de datos local mockeada
    const mockDB = [
      "Av. Paulista, São Paulo",
      "Estación Central, Metro",
      "Parque Ibirapuera, São Paulo",
      "Aeropuerto Internacional",
      "Centro Comercial",
      "Museo de Arte",
      "Calle Florida, Buenos Aires",
      "Paseo de la Reforma, CDMX",
      "Gran Vía, Madrid",
      "Estadio Municipal"
    ];

    return mockDB.filter(item => item.toLowerCase().includes(query.toLowerCase())).slice(0, 4);
  },

  // 5. Pegado Inteligente (Extracción de direcciones)
  extractAddressFromText: (text: string): string | null => {
    if (!text || text.length > 500) return null; // Ignorar textos muy largos

    // Heurística simple: Busca patrones comunes de dirección
    // Ej: "Calle Falsa 123", "Av. Siempre Viva 742"
    const addressRegex = /(?:calle|av\.|avenida|rua|street|place|plaza|paseo)\s+[\w\s\.]+\d+/i;
    const match = text.match(addressRegex);
    
    if (match) {
        return match[0];
    }
    
    // Si es un texto corto que parece un lugar, devolverlo entero
    if (text.length < 50 && text.length > 4) return text;

    return null;
  }
};
