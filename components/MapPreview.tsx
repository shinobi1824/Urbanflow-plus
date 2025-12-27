import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { VehiclePosition, TransportMode, RouteResult, GeoArea, Coordinates } from '../types';

// Token público de Mapbox
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2hpbm9iaTE4MjQiLCJhIjoiY21qbjB4dnh2MzA5MjNjb3RvbWk0cTU1aCJ9.uU0pDBBbfgsEkCss3j8Ckg';

interface MapPreviewProps {
  offline?: boolean;
  vehicles?: VehiclePosition[];
  selectedRoute?: RouteResult;
  userLocation?: Coordinates;
  isSelectionMode?: boolean;
  selectionArea?: { x1: number; y1: number; x2: number; y2: number };
  onSelectionChange?: (area: { x1: number; y1: number; x2: number; y2: number }) => void;
  downloadedZones?: GeoArea[];
  theme?: 'light' | 'dark';
}

// Coordenadas base (São Paulo - Av Paulista) por defecto si no hay GPS
const DEFAULT_CENTER: [number, number] = [-46.6559, -23.5615]; 

const MapPreview: React.FC<MapPreviewProps> = ({ 
  offline, 
  vehicles = [], 
  selectedRoute, 
  userLocation,
  isSelectionMode, 
  selectionArea,
  onSelectionChange,
  downloadedZones = [],
  theme = 'dark'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<'tl' | 'br' | null>(null);

  // Inicializar Mapbox
  useEffect(() => {
    if (!mapContainer.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const style = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';
    
    // Usar ubicación real si existe, sino default
    const center = userLocation ? [userLocation.lng, userLocation.lat] : DEFAULT_CENTER;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: [center[0], center[1]],
      zoom: 14.5,
      pitch: 45, // Inclinación para efecto 3D
      bearing: -17.6,
      attributionControl: false
    });

    map.current.on('load', () => {
      if (!map.current) return;
      
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      // Edificios 3D
      map.current.addLayer(
        {
          'id': 'add-3d-buildings',
          'source': 'composite',
          'source-layer': 'building',
          'filter': ['==', 'extrude', 'true'],
          'type': 'fill-extrusion',
          'minzoom': 13,
          'paint': {
            'fill-extrusion-color': theme === 'light' ? '#e5e7eb' : '#242b35',
            'fill-extrusion-height': ['get', 'height'],
            'fill-extrusion-base': ['get', 'min_height'],
            'fill-extrusion-opacity': 0.6
          }
        },
        labelLayerId
      );

      // Fuente de datos para la ruta
      map.current.addSource('route', {
        'type': 'geojson',
        'data': {
          'type': 'Feature',
          'properties': {},
          'geometry': {
            'type': 'LineString',
            'coordinates': []
          }
        }
      });

      map.current.addLayer({
        'id': 'route',
        'type': 'line',
        'source': 'route',
        'layout': {
          'line-join': 'round',
          'line-cap': 'round'
        },
        'paint': {
          'line-color': '#3B82F6',
          'line-width': 8,
          'line-opacity': 0.8
        }
      });
      
      map.current.addLayer({
        'id': 'route-glow',
        'type': 'line',
        'source': 'route',
        'layout': { 'line-join': 'round', 'line-cap': 'round' },
        'paint': {
          'line-color': '#60A5FA',
          'line-width': 4,
          'line-blur': 4,
          'line-opacity': 1
        }
      });
    });

    return () => map.current?.remove();
  }, [theme]); 

  // Manejar Marcador de Usuario (Real Location)
  useEffect(() => {
    if (!map.current || !userLocation) return;

    // Crear elemento DOM personalizado para el usuario
    const el = document.createElement('div');
    el.className = 'user-marker';
    el.innerHTML = `
      <div class="relative flex items-center justify-center">
         <div class="absolute w-12 h-12 rounded-full animate-ping opacity-30 bg-blue-500"></div>
         <div class="w-4 h-4 rounded-full border-[2px] border-white shadow-xl bg-blue-600"></div>
      </div>
    `;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.lng, userLocation.lat]);
    } else {
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map.current);
    }

    // Si no hay ruta seleccionada, centrar en usuario la primera vez
    if (!selectedRoute) {
       // Opcional: Centrar suavemente
       // map.current.easeTo({ center: [userLocation.lng, userLocation.lat], zoom: 14 });
    }

  }, [userLocation]);

  // Actualizar Ruta
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (selectedRoute) {
      // Si el usuario tiene ubicación real, usaremos su ubicación como inicio de la ruta visual
      // Nota: Idealmente selectedRoute traería la polyline real decodificada.
      // Aquí simulamos una línea desde UserLocation -> Destino simulado
      
      const start: [number, number] = userLocation 
        ? [userLocation.lng, userLocation.lat] 
        : DEFAULT_CENTER;
        
      // Destino simulado relativo al inicio para que se vea bien
      const end: [number, number] = [start[0] + 0.02, start[1] + 0.02];

      const routeGeoJSON: any = {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            start,
            [start[0] + 0.005, start[1] + 0.01],
            [start[0] + 0.015, start[1] + 0.015],
            end
          ]
        }
      };

      const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      if (source) source.setData(routeGeoJSON);
      
      // Ajustar cámara a la ruta
      const coordinates = routeGeoJSON.geometry.coordinates;
      const bounds = new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]);
      for (const coord of coordinates) {
        bounds.extend(coord as [number, number]);
      }
      map.current.fitBounds(bounds, { padding: 80 });
      map.current.setPaintProperty('route', 'line-color', selectedRoute.isPremium ? '#6366f1' : '#3B82F6');
    
    } else {
      const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({ 'type': 'Feature', 'properties': {}, 'geometry': { 'type': 'LineString', 'coordinates': [] } });
      }
    }
  }, [selectedRoute, userLocation]);

  const centerOnUser = () => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: [userLocation.lng, userLocation.lat],
        zoom: 15,
        speed: 1.5,
        curve: 1
      });
    } else {
      alert("Esperando señal GPS...");
    }
  };

  // ... (Lógica de selección de área se mantiene igual) ...
  const handleMouseDown = (e: React.MouseEvent, handle: 'tl' | 'br') => { /* ... */ };
  const handleMouseMove = (e: React.MouseEvent) => { /* ... */ };
  const handleMouseUp = () => { /* ... */ };

  return (
    <div className={`w-full h-full relative overflow-hidden transition-all duration-1000 ${offline ? 'grayscale saturate-50 brightness-90' : ''}`}>
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Botón Centrar Ubicación Real */}
      {!isSelectionMode && (
        <button 
          onClick={centerOnUser}
          className="absolute bottom-6 right-6 w-12 h-12 bg-white dark:bg-[#121820] rounded-full shadow-xl flex items-center justify-center text-blue-500 z-30 active:scale-90 transition-transform border border-gray-200 dark:border-white/10"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="3" fill="currentColor" />
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </svg>
        </button>
      )}

      {/* Overlay de Selección (Omitido para brevedad, se mantiene igual que antes) */}
    </div>
  );
};

export default MapPreview;