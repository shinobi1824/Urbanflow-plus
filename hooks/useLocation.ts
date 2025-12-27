
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { Geolocation, PermissionStatus } from '@capacitor/geolocation';
import { ExternalServices } from './services/external';

interface LocationState {
  userLocation?: { lat: number; lng: number };
  permissionStatus: 'prompt' | 'granted' | 'denied';
}

export const useLocation = () => {
  const [locationState, setLocationState] = useState<LocationState>({
    permissionStatus: 'prompt',
  });
  const [toast, setToast] = useState<{ message: string, type: 'info' | 'success' | 'error' } | null>(null);

  const checkPermission = async () => {
    try {
      const platform = Capacitor.getPlatform();
      if (platform !== 'web') {
        const status = await Geolocation.checkPermissions();
        setLocationState(prev => ({ ...prev, permissionStatus: status.location as any }));
        if (status.location === 'granted') {
          handleGetLocation();
        }
      } else {
        if (navigator.permissions && navigator.permissions.query) {
          const result = await navigator.permissions.query({ name: 'geolocation' as any });
          setLocationState(prev => ({ ...prev, permissionStatus: result.state as any }));
          if (result.state === 'granted') {
            handleGetLocation();
          }
        } else {
          handleGetLocation(); // Fallback for older browsers
        }
      }
    } catch (e) {
      console.warn("Permissions check failed:", e);
    }
  };

  const handleGetLocation = async () => {
    try {
      let lat: number | undefined;
      let lng: number | undefined;
      const platform = Capacitor.getPlatform();
      const isNative = platform !== 'web';

      if (isNative) {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          setLocationState(prev => ({ ...prev, permissionStatus: 'denied' }));
          return;
        }
      }

      if (isNative) {
        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        lat = position.coords.latitude;
        lng = position.coords.longitude;
      } else {
        if (!navigator.geolocation) {
          setToast({ message: "Geolocalización no soportada", type: 'error' });
          return;
        }
        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              lat = position.coords.latitude;
              lng = position.coords.longitude;
              resolve(true);
            },
            (error) => reject(error),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
          );
        });
      }

      if (lat !== undefined && lng !== undefined) {
        setLocationState({ userLocation: { lat, lng }, permissionStatus: 'granted' });
        setToast({ message: "Ubicación actualizada", type: 'success' });
        return { lat, lng };
      }
    } catch (error: any) {
      console.error("Error GPS:", error);
      if (error.code === 1 || error.message?.includes('denied')) {
        setLocationState(prev => ({ ...prev, permissionStatus: 'denied' }));
      } else {
        setToast({ message: "Error de señal GPS", type: 'error' });
      }
    }
    return undefined;
  };

  useEffect(() => {
    checkPermission();
  }, []);

  return { ...locationState, toast, handleGetLocation, setToast };
};
