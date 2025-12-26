
export enum Language {
  EN = 'en',
  ES = 'es',
  PT = 'pt'
}

export enum TransportMode {
  WALK = 'walk',
  BUS = 'bus',
  METRO = 'metro',
  TRAIN = 'train',
  BIKE = 'bike',
  RIDE = 'ride',
  SCOOTER = 'scooter'
}

export type RouteFilter = 'fastest' | 'cheapest' | 'less_walking' | 'less_transfers' | 'accessible';

export interface SocialPost {
  id: string;
  userName: string;
  userAvatar: string;
  type: 'alert' | 'vibe' | 'tip';
  content: string;
  timestamp: number;
  likes: number;
  lineContext?: string;
}

export interface RouteStep {
  mode: TransportMode;
  instruction: string;
  durationMinutes: number;
  lineName?: string;
  color?: string;
  isCovered?: boolean;
}

export interface RouteResult {
  id: string;
  totalTime: number;
  cost: number;
  walkingDistance: number;
  transfers: number;
  co2Savings: number;
  caloriesBurned?: number; 
  safetyScore?: number; 
  steps: RouteStep[];
  aiReasoning: string;
  isAccessible: boolean;
  startTime: string;
  endTime: string;
  isPremium?: boolean;
  weatherAlert?: string;
  pathPoints?: string;
  timeSavedMinutes?: number;
  trafficDelayMinutes?: number;
  transferConfidence?: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  progress: number;
  total: number;
  unlocked: boolean;
  points: number;
}

export interface GeoArea {
  id: string;
  name: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  sizeMB: number;
}

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  points?: number;
  level?: number;
  // Added fields to support ImpactCenter usage
  levelTitle?: string;
  treesPlanted?: number;
}

export interface AppState {
  currentPage: 'onboarding' | 'login' | 'home' | 'planner' | 'premium' | 'settings' | 'agencies' | 'navigation' | 'map_selection' | 'impact' | 'launch_guide' | 'offline_manager' | 'social';
  user: UserPreferences;
  auth?: { isLoggedIn: boolean; profile?: UserProfile; };
  origin: string;
  destination: string;
  searchResults: RouteResult[];
  selectedRoute?: RouteResult;
  selectedFilter: RouteFilter;
  isLoading: boolean;
  isOnline: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  isNavigating: boolean;
  isSharingLive: boolean;
  nearbyAgencies: Agency[];
  liveVehicles: VehiclePosition[];
  liveArrivals: LiveArrival[];
  recentTrips: any[];
  weather?: { temp: number; condition: string };
  socialFeed: SocialPost[];
}

export interface VehiclePosition {
  id: string;
  lineName: string;
  lat: number;
  lng: number;
  bearing: number;
  mode: TransportMode;
}

export interface Agency {
  id: string;
  name: string;
  region: string;
  hasRealtime: boolean;
  coverageRadius: number;
  countryCode: string;
}

export interface LiveArrival {
  lineId: string;
  lineName: string;
  scheduledTime: string;
  estimatedTime: string;
  delayMinutes: number;
  status: 'on-time' | 'delayed' | 'early' | string;
  occupancy: 'low' | 'medium' | 'high' | string;
}

export interface UserPreferences {
  homeAddress?: string;
  workAddress?: string;
  favorites: string[];
  theme: 'light' | 'dark';
  language: Language;
  isPremium: boolean;
  accessibilityMode: boolean;
  extremeBatterySaver: boolean;
  safetyPriority: boolean;
  offlineMode: boolean;
  offlineData: any;
  selectedAgencyId?: string;
  // Profile fields synced from Firestore
  name?: string;
  email?: string;
  points?: number;
  level?: number;
  createdAt?: string;
}
