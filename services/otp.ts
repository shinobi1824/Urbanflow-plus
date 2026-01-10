
import { RouteResult, TransportMode, RouteStep } from "../types";

// URL del Endpoint GraphQL de OTP.
// Para producción, usar tu propia instancia (ej: http://localhost:8080/otp/routers/default/index/graphql)
const OTP_ENDPOINT = import.meta.env.VITE_OTP_ENDPOINT || '';

const TRANSMODEL_QUERY = `
  query Trip($fromLat: Float!, $fromLon: Float!, $toLat: Float!, $toLon: Float!) {
    trip(
      from: {coordinates: {latitude: $fromLat, longitude: $fromLon}}
      to: {coordinates: {latitude: $toLat, longitude: $toLon}}
      numTripPatterns: 3
    ) {
      tripPatterns {
        startTime
        endTime
        duration
        walkDistance
        legs {
          mode
          distance
          duration
          from {
            name
          }
          to {
            name
          }
          line {
            id
            publicCode
          }
        }
      }
    }
  }
`;

export const OTPService = {
  async planTrip(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<RouteResult[]> {
    if (!OTP_ENDPOINT) {
      throw new Error("Missing VITE_OTP_ENDPOINT for real routing.");
    }
    try {
      const response = await fetch(OTP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ET-Client-Name': 'urbanflow-plus-web-client' // Header requerido por muchas APIs públicas de OTP
        },
        body: JSON.stringify({
          query: TRANSMODEL_QUERY,
          variables: {
            fromLat: from.lat,
            fromLon: from.lng,
            toLat: to.lat,
            toLon: to.lng
          }
        })
      });

      if (!response.ok) {
         console.warn(`OTP API HTTP Error: ${response.status}`);
         return [];
      }

      const text = await response.text();
      let json;
      try {
        json = JSON.parse(text);
      } catch (e) {
        console.warn("OTP API Response was not JSON:", text.substring(0, 100));
        return [];
      }
      
      if (json.errors) {
        // Use console.log for array/objects to ensure browser console expands them
        console.warn("OTP API Errors:", json.errors);
        return [];
      }

      const patterns = json.data?.trip?.tripPatterns || [];
      return patterns.map(mapOtpPatternToRouteResult);

    } catch (error) {
      console.warn("OTP Service Unreachable (Using AI Fallback):", error);
      return []; // Retorna vacío para activar el fallback de Gemini
    }
  }
};

// Mapper: Convierte la respuesta compleja de Transmodel a nuestra UI simple
function mapOtpPatternToRouteResult(pattern: any, index: number): RouteResult {
  if (!pattern) return {} as RouteResult;
  
  const startTime = new Date(pattern.startTime || Date.now());
  const endTime = new Date(pattern.endTime || Date.now());
  const durationMinutes = Math.round((pattern.duration || 0) / 60);

  let totalCost = 0;
  let transfers = 0;

  const steps: RouteStep[] = (pattern.legs || []).map((leg: any) => {
    const mode = mapOtpMode(leg.mode);
    if (mode !== TransportMode.WALK) {
      totalCost += 1.50; // Costo base simulado por pierna de transporte
      transfers++;
    }

    return {
      mode: mode,
      instruction: mode === TransportMode.WALK 
        ? `Caminar hacia ${leg.to?.name || 'el destino'}` 
        : `Tomar ${leg.line?.publicCode || leg.mode} hacia ${leg.to?.name || 'la parada'}`,
      durationMinutes: Math.round((leg.duration || 0) / 60),
      lineName: leg.line?.publicCode || undefined,
      color: getModeColor(mode)
    };
  });

  return {
    id: `otp-real-${index}-${Date.now()}`,
    totalTime: durationMinutes,
    cost: totalCost || 0, // Si es todo caminar, gratis
    walkingDistance: Math.round(pattern.walkDistance || 0),
    transfers: Math.max(0, transfers - 1), // Restamos 1 porque el primer abordaje no es transbordo
    co2Savings: 0, // Se calculará con AI o lógica local
    steps: steps,
    aiReasoning: "Ruta calculada con precisión GTFS.", // Placeholder hasta que Gemini lo enriquezca
    isAccessible: true, // Asumimos true por defecto en OTP modernos
    startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isPremium: true // El routing real es premium
  };
}

function mapOtpMode(otpMode: string): TransportMode {
  switch (otpMode) {
    case 'BUS': return TransportMode.BUS;
    case 'SUBWAY':
    case 'METRO': return TransportMode.METRO;
    case 'RAIL':
    case 'TRAM': return TransportMode.TRAIN;
    case 'WALK': return TransportMode.WALK;
    case 'BICYCLE': return TransportMode.BIKE;
    default: return TransportMode.RIDE;
  }
}

function getModeColor(mode: TransportMode): string {
  switch (mode) {
    case TransportMode.BUS: return '#3B82F6';
    case TransportMode.METRO: return '#EF4444';
    case TransportMode.TRAIN: return '#10B981';
    default: return '#9CA3AF';
  }
}
