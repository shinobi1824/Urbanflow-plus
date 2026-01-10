
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
  if (!TRANSITLAND_API_KEY) {
    throw new Error("Missing VITE_TRANSITLAND_API_KEY for nearby agencies.");
  }

  const endpoint = `https://transit.land/api/v2/rest/agencies?apikey=${TRANSITLAND_API_KEY}&geometry_within=POINT(${lng} ${lat})`;
  const res = await fetch(endpoint);
  if (!res.ok) {
    throw new Error(`Transitland error: ${res.status}`);
  }
  const data = await res.json();
  const agencies = data?.agencies || [];

  return agencies.map((agency: any) => ({
    id: agency.onestop_id || agency.id || agency.name,
    name: agency.name,
    region: agency.place?.name || agency.metro || '',
    countryCode: agency.country || '',
    hasRealtime: Boolean(agency.feed_format === 'gtfs-rt' || agency.has_realtime),
    coverageRadius: 50
  }));
}

export function getMockLiveVehicles(): VehiclePosition[] {
  return [];
}

export function getMockLiveArrivals(): LiveArrival[] {
  return [];
}
