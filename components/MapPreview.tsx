
import React, { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { VehiclePosition, TransportMode, RouteResult, GeoArea } from '../types';

// Token público de Mapbox (restringir dominios en dashboard de Mapbox para seguridad)
const MAPBOX_TOKEN = 'pk.eyJ1Ijoic2hpbm9iaTE4MjQiLCJhIjoiY21qbjB4dnh2MzA5MjNjb3RvbWk0cTU1aCJ9.uU0pDBBbfgsEkCss3j8Ckg';

interface MapPreviewProps {
  offline?: boolean;
  vehicles?: VehiclePosition[];
  selectedRoute?: RouteResult;
  isSelectionMode?: boolean;
  selectionArea?: { x1: number; y1: number; x2: number; y2: number };
  onSelectionChange?: (area: { x1: number; y1: number; x2: number; y2: number }) => void;
  downloadedZones?: GeoArea[];
  theme?: 'light' | 'dark';
}

// Coordenadas base (São Paulo - Av Paulista) para simular el entorno real
const BASE_CENTER = [-46.6559, -23.5615]; 

const MapPreview: React.FC<MapPreviewProps> = ({ 
  offline, 
  vehicles = [], 
  selectedRoute, 
  isSelectionMode, 
  selectionArea,
  onSelectionChange,
  downloadedZones = [],
  theme = 'dark'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
  
  const [isDragging, setIsDragging] = useState(false);
  const [dragHandle, setDragHandle] = useState<'tl' | 'br' | null>(null);

  // Inicializar Mapbox
  useEffect(() => {
    if (!mapContainer.current) return;
    
    mapboxgl.accessToken = MAPBOX_TOKEN;

    const style = theme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: style,
      center: [BASE_CENTER[0], BASE_CENTER[1]],
      zoom: 13.5,
      pitch: 45, // Inclinación para efecto 3D
      bearing: -17.6,
      attributionControl: false
    });

    map.current.on('load', () => {
      // Capa de edificios 3D
      if (!map.current) return;
      
      const layers = map.current.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

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
      
      // Capa de animación de ruta (brillo)
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
  }, [theme]); // Re-initialize map if theme changes

  // Actualizar Ruta
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (selectedRoute) {
      // Simular geometría real basada en el ID de la ruta (normalmente vendría del backend)
      // Generamos puntos alrededor del centro base
      const routeGeoJSON: any = {
        'type': 'Feature',
        'properties': {},
        'geometry': {
          'type': 'LineString',
          'coordinates': [
            [BASE_CENTER[0] - 0.02, BASE_CENTER[1] - 0.01], // Inicio
            [BASE_CENTER[0] - 0.01, BASE_CENTER[1] + 0.01],
            [BASE_CENTER[0] + 0.01, BASE_CENTER[1] + 0.005],
            [BASE_CENTER[0] + 0.02, BASE_CENTER[1] - 0.015] // Fin
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
      map.current.fitBounds(bounds, { padding: 100 });

      // Cambiar color si es premium
      map.current.setPaintProperty('route', 'line-color', selectedRoute.isPremium ? '#6366f1' : '#3B82F6');
    
    } else {
      // Limpiar ruta si no hay selección
      const source = map.current.getSource('route') as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData({
          'type': 'Feature', 'properties': {}, 'geometry': { 'type': 'LineString', 'coordinates': [] }
        });
      }
      // Volver a posición inicial
      map.current.flyTo({ center: [BASE_CENTER[0], BASE_CENTER[1]], zoom: 13.5 });
    }
  }, [selectedRoute]);

  // Actualizar Vehículos en Tiempo Real
  useEffect(() => {
    if (!map.current) return;

    // Convertimos coordenadas simuladas (0-100) a LatLng reales alrededor del centro
    // 0-100 mapea a aprox +/- 0.05 grados lat/lng
    const vehiclesWithRealCoords = vehicles.map(v => ({
      ...v,
      realLat: BASE_CENTER[1] + (v.lat - 50) * 0.001,
      realLng: BASE_CENTER[0] + (v.lng - 50) * 0.001
    }));

    // Eliminar marcadores viejos que ya no existen
    Object.keys(markersRef.current).forEach(id => {
      if (!vehicles.find(v => v.id === id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Crear o actualizar marcadores
    vehiclesWithRealCoords.forEach(v => {
      if (markersRef.current[v.id]) {
        // Animar movimiento
        markersRef.current[v.id].setLngLat([v.realLng, v.realLat]);
        // Rotar elemento interno (hack CSS para rotación de icono)
        const el = markersRef.current[v.id].getElement();
        const inner = el.querySelector('div');
        if (inner) inner.style.transform = `rotate(${v.bearing}deg)`;
      } else {
        // Crear elemento DOM personalizado
        const el = document.createElement('div');
        el.className = 'vehicle-marker';
        el.innerHTML = `
          <div style="
            width: 36px; 
            height: 36px; 
            background: ${v.mode === TransportMode.BUS ? '#FBBF24' : '#EF4444'}; 
            border-radius: 12px; 
            border: 2px solid white; 
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            transition: transform 0.3s;
            transform: rotate(${v.bearing}deg);
          ">
            ${v.mode === TransportMode.BUS ? '🚌' : '🚇'}
          </div>
        `;

        markersRef.current[v.id] = new mapboxgl.Marker(el)
          .setLngLat([v.realLng, v.realLat])
          .addTo(map.current!);
      }
    });
  }, [vehicles]);


  // Lógica de Selección de Área (Mantenemos la lógica visual sobre el mapa)
  const handleMouseDown = (e: React.MouseEvent, handle: 'tl' | 'br') => {
    if (!isSelectionMode) return;
    setIsDragging(true);
    setDragHandle(handle);
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isSelectionMode || !isDragging || !selectionArea || !onSelectionChange) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1000;
    const y = ((e.clientY - rect.top) / rect.height) * 1000;

    if (dragHandle === 'tl') {
      onSelectionChange({ ...selectionArea, x1: Math.min(x, selectionArea.x2 - 50), y1: Math.min(y, selectionArea.y2 - 50) });
    } else if (dragHandle === 'br') {
      onSelectionChange({ ...selectionArea, x2: Math.max(x, selectionArea.x1 + 50), y2: Math.max(y, selectionArea.y1 + 50) });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragHandle(null);
  };

  return (
    <div 
      className={`w-full h-full relative overflow-hidden transition-all duration-1000 ${offline ? 'grayscale saturate-50 brightness-90' : ''}`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Contenedor del Mapa Mapbox */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {/* Overlay para modo Selección (SVG sobre el Canvas de Mapbox) */}
      {isSelectionMode && selectionArea && (
        <svg className="w-full h-full absolute inset-0 z-40 pointer-events-none" viewBox="0 0 1000 1000">
          <defs>
            <filter id="selectionGlow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          
          <path 
            fill="rgba(0,0,0,0.5)" 
            fillRule="evenodd"
            d={`M0,0 H1000 V1000 H0 Z M${selectionArea.x1},${selectionArea.y1} V${selectionArea.y2} H${selectionArea.x2} V${selectionArea.y1} Z`} 
          />
          
          <rect 
            x={selectionArea.x1} y={selectionArea.y1} 
            width={selectionArea.x2 - selectionArea.x1} 
            height={selectionArea.y2 - selectionArea.y1}
            fill="rgba(59, 130, 246, 0.1)"
            stroke="#3B82F6"
            strokeWidth="4"
            filter="url(#selectionGlow)"
          />

          <foreignObject x={selectionArea.x1 - 10} y={selectionArea.y1 - 10} width="40" height="40" className="pointer-events-auto">
             <div onMouseDown={(e) => handleMouseDown(e, 'tl')} className="w-6 h-6 bg-white border-4 border-blue-500 rounded-full cursor-nwse-resize shadow-lg"></div>
          </foreignObject>
          
          <foreignObject x={selectionArea.x2 - 10} y={selectionArea.y2 - 10} width="40" height="40" className="pointer-events-auto">
             <div onMouseDown={(e) => handleMouseDown(e, 'br')} className="w-6 h-6 bg-white border-4 border-blue-500 rounded-full cursor-nwse-resize shadow-lg"></div>
          </foreignObject>

          <text x={selectionArea.x1} y={selectionArea.y1 - 15} className="fill-white font-black text-[12px] uppercase">
            Seleccionar Zona Offline
          </text>
        </svg>
      )}

      {/* Ubicación de usuario (siempre visible sobre el mapa) */}
      {!isSelectionMode && (
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-16 h-16 rounded-full animate-ping opacity-20 bg-blue-500"></div>
            <div className="w-6 h-6 rounded-full border-[4px] border-white shadow-2xl bg-blue-500"></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapPreview;
