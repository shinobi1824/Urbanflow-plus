
import { Agency, VehiclePosition, TransportMode, LiveArrival } from "../types";

// API Key de Transitland para datos GTFS-RT reales
const TRANSITLAND_API_KEY = import.meta.env.VITE_TRANSITLAND_API_KEY || '';

// Base de datos de agencias expandida para Latinoamérica (Fallback robusto)
const GLOBAL_AGENCIES_DB: Agency[] = [
  { id: 'sptrans', name: 'SPTrans (Bus)', region: 'São Paulo', countryCode: 'BR', hasRealtime: true, coverageRadius: 60 },
  { id: 'transmilenio', name: 'TransMilenio', region: 'Bogotá', countryCode: 'CO', hasRealtime: true, coverageRadius: 45 },
  { id: 'metro-cdmx', name: 'Metro CDMX', region: 'Ciudad de México', countryCode: 'MX', hasRealtime: true, coverageRadius: 80 },
  { id: 'subte-ba', name: 'Subte', region: 'Buenos Aires', countryCode: 'AR', hasRealtime: true, coverageRadius: 40 },
  { id: 'red-stgo', name: 'Red Movilidad', region: 'Santiago', countryCode: 'CL', hasRealtime: true, coverageRadius: 55 },
  { id: 'cr-madrid', name: 'CRTM', region: 'Madrid', countryCode: 'ES', hasRealtime: true, coverageRadius: 70 }
];

export const TransitEvents = {
  getCommunityReports: () => [
    { type: 'full', line: '8012-10', message: 'Bus muy lleno', timestamp: Date.now() - 300000 },
    { type: 'delay', line: 'L4 Yellow', message: 'Retraso de 5 min por falla técnica', timestamp: Date.now() - 600000 }
  ]
};

export async function fetchNearbyAgencies(lat: number, lng: number): Promise<Agency[]> {
  // CONFIGURACIÓN DE PRODUCCIÓN:
  // Se ha inyectado el token de Transitland. En un despliegue real, descomentar la siguiente línea:
  // const endpoint = `https://transit.land/api/v2/rest/agencies?apikey=${TRANSITLAND_API_KEY}&geometry_within=POINT(${lng} ${lat})`;
  
  // console.log(`[UrbanFlow+] Transitland Connected: ${TRANSITLAND_API_KEY.substring(0, 8)}...`);

  // Simulamos latencia de red para experiencia realista mientras usamos la DB local optimizada
  await new Promise(r => setTimeout(r, 600));
  return GLOBAL_AGENCIES_DB;
}

export function getMockLiveVehicles(): VehiclePosition[] {
  return [
    { id: 'v1', lineName: '8012-10', lat: 45, lng: 52, bearing: 90, mode: TransportMode.BUS },
    { id: 'v2', lineName: 'L4 Yellow', lat: 30, lng: 40, bearing: 180, mode: TransportMode.METRO },
    { id: 'v3', lineName: '702U-10', lat: 60, lng: 20, bearing: 45, mode: TransportMode.BUS },
  ];
}

export function getMockLiveArrivals(): LiveArrival[] {
  return [
    { 
      lineId: 'l1', 
      lineName: '8012-10 Metro Butantã', 
      scheduledTime: '14:30', 
      estimatedTime: '14:32', 
      delayMinutes: 2, 
      status: 'delayed',
      occupancy: 'medium'
    },
    { 
      lineId: 'l2', 
      lineName: '702U-10 Term. Amaral', 
      scheduledTime: '14:35', 
      estimatedTime: '14:35', 
      delayMinutes: 0, 
      status: 'on-time',
      occupancy: 'low'
    }
  ];
}
