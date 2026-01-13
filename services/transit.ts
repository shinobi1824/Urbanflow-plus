
import { Agency, VehiclePosition, TransportMode, LiveArrival } from "../types";
import { RouteResult, RouteStep } from "../types";

// API Key de Transitland para datos GTFS-RT reales
const TRANSITLAND_API_KEY = import.meta.env.VITE_TRANSITLAND_API_KEY || '';
const TRANSITLAND_ROUTING_ENDPOINT = import.meta.env.VITE_TRANSITLAND_ROUTING_ENDPOINT || '';

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

export const TransitlandRoutingService = {
  async planTrip(from: { lat: number; lng: number }, to: { lat: number; lng: number }): Promise<RouteResult[]> {
    if (!TRANSITLAND_API_KEY) {
      throw new Error("Missing VITE_TRANSITLAND_API_KEY for routing.");
    }
    if (!TRANSITLAND_ROUTING_ENDPOINT) {
      throw new Error("Missing VITE_TRANSITLAND_ROUTING_ENDPOINT for routing.");
    }

    const url = new URL(TRANSITLAND_ROUTING_ENDPOINT);
    const params = url.searchParams;
    params.set("from", `${from.lat},${from.lng}`);
    params.set("to", `${to.lat},${to.lng}`);
    params.set("fromPlace", `${from.lat},${from.lng}`);
    params.set("toPlace", `${to.lat},${to.lng}`);
    params.set("apikey", TRANSITLAND_API_KEY);
    params.set("api_key", TRANSITLAND_API_KEY);
    url.search = params.toString();

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`Transitland routing error: ${response.status}`);
    }
    const data = await response.json();

    const itineraries = data?.plan?.itineraries || data?.itineraries || [];
    return itineraries.map((itinerary: any, index: number) =>
      mapItineraryToRouteResult(itinerary, index)
    );
  }
};

export function getMockLiveVehicles(): VehiclePosition[] {
  return [];
}

export function getMockLiveArrivals(): LiveArrival[] {
  return [];
}

function mapItineraryToRouteResult(itinerary: any, index: number): RouteResult {
  if (!itinerary) return {} as RouteResult;

  const durationMinutes = Math.round((itinerary.duration || 0) / 60);
  const startTime = new Date(itinerary.startTime || Date.now());
  const endTime = new Date(itinerary.endTime || Date.now());

  const steps: RouteStep[] = (itinerary.legs || []).map((leg: any) => {
    const mode = mapTransitlandMode(leg.mode);
    const lineName = leg.route?.shortName || leg.route?.longName || leg.route?.name;
    const destinationName = leg.to?.name || "la parada";
    const instruction =
      mode === TransportMode.WALK
        ? `Caminar hacia ${destinationName}`
        : `Tomar ${lineName || leg.mode} hacia ${destinationName}`;

    return {
      mode,
      instruction,
      durationMinutes: Math.round((leg.duration || 0) / 60),
      lineName,
      color: getModeColor(mode)
    };
  });

  const transfers =
    itinerary.transfers ??
    Math.max(0, steps.filter((step) => step.mode !== TransportMode.WALK).length - 1);
  const walkingDistance = Math.round(itinerary.walkDistance || 0);

  return {
    id: `transitland-${index}-${Date.now()}`,
    totalTime: durationMinutes,
    cost: 0,
    walkingDistance,
    transfers,
    co2Savings: 0,
    steps,
    aiReasoning: "Ruta calculada con Transitland Routing.",
    isAccessible: true,
    startTime: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    endTime: endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    isPremium: true
  };
}

function mapTransitlandMode(mode: string): TransportMode {
  switch ((mode || "").toUpperCase()) {
    case "BUS":
      return TransportMode.BUS;
    case "SUBWAY":
    case "METRO":
      return TransportMode.METRO;
    case "RAIL":
    case "TRAM":
      return TransportMode.TRAIN;
    case "WALK":
      return TransportMode.WALK;
    case "BICYCLE":
      return TransportMode.BIKE;
    default:
      return TransportMode.RIDE;
  }
}

function getModeColor(mode: TransportMode): string {
  switch (mode) {
    case TransportMode.BUS:
      return '#3B82F6';
    case TransportMode.METRO:
      return '#EF4444';
    case TransportMode.TRAIN:
      return '#10B981';
    default:
      return '#9CA3AF';
  }
}
