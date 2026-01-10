
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
    if (!OPENWEATHER_API_KEY) {
      throw new Error("Missing VITE_OPENWEATHER_API_KEY for weather updates.");
    }

    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    if (!res.ok) {
      throw new Error(`OpenWeather error: ${res.status}`);
    }
    const data = await res.json();

    return {
      temp: Math.round(data.main?.temp ?? 0),
      condition: data.weather?.[0]?.main || 'Unknown',
      humidity: (data.main?.humidity ?? 0) / 100,
      willRainInNextHour: Boolean(data.rain)
    };
  },

  // 3. Geocoding (Convertir texto a coordenadas reales)
  searchAddress: async (query: string) => {
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      throw new Error("Missing VITE_MAPBOX_TOKEN for geocoding.");
    }

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&limit=1&language=es`
    );
    if (!res.ok) {
      throw new Error(`Mapbox geocoding error: ${res.status}`);
    }
    const data = await res.json();
    const feature = data.features?.[0];
    if (!feature) {
      throw new Error("No geocoding results found.");
    }

    return {
      name: feature.place_name || query,
      lat: feature.center?.[1],
      lng: feature.center?.[0]
    };
  },

  // 4. Escritura Predictiva (Autocompletado Mock)
  getPredictions: async (query: string): Promise<string[]> => {
    if (!query || query.length < 2) return [];
    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
    if (!mapboxToken) {
      throw new Error("Missing VITE_MAPBOX_TOKEN for autocomplete.");
    }

    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxToken}&autocomplete=true&limit=5&language=es`
    );
    if (!res.ok) {
      throw new Error(`Mapbox autocomplete error: ${res.status}`);
    }
    const data = await res.json();
    return (data.features || []).map((feature: any) => feature.place_name).filter(Boolean);
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
