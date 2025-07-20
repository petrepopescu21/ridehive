import { useEffect, useState } from 'react';

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export const useGeolocation = (trackLocation: boolean = false) => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [permission, setPermission] = useState<boolean | null>(null);

  useEffect(() => {
    let watchId: number | null = null;

    const setupLocation = async () => {
      try {
        // Check if geolocation is supported
        if (!navigator.geolocation) {
          setError('Geolocation is not supported by this browser');
          setPermission(false);
          return;
        }

        if (trackLocation) {
          // Start tracking location
          watchId = navigator.geolocation.watchPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy || undefined,
                timestamp: position.timestamp,
              });
              setError(null);
              setPermission(true);
            },
            (err) => {
              let errorMessage = 'Failed to get location';
              switch (err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied';
                  setPermission(false);
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable';
                  break;
                case err.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  break;
              }
              setError(errorMessage);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 5000, // Update every 5 seconds
            }
          );
        } else {
          // Get current location once
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setLocation({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                accuracy: position.coords.accuracy || undefined,
                timestamp: position.timestamp,
              });
              setError(null);
              setPermission(true);
            },
            (err) => {
              let errorMessage = 'Failed to get location';
              switch (err.code) {
                case err.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied';
                  setPermission(false);
                  break;
                case err.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable';
                  break;
                case err.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  break;
              }
              setError(errorMessage);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            }
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get location');
        setPermission(false);
      }
    };

    setupLocation();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [trackLocation]);

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy || undefined,
            timestamp: position.timestamp,
          };
          setLocation(locationData);
          setError(null);
          setPermission(true);
          resolve(locationData);
        },
        (err) => {
          let errorMessage = 'Failed to get location';
          switch (err.code) {
            case err.PERMISSION_DENIED:
              errorMessage = 'Location permission denied';
              setPermission(false);
              break;
            case err.POSITION_UNAVAILABLE:
              errorMessage = 'Location information unavailable';
              break;
            case err.TIMEOUT:
              errorMessage = 'Location request timed out';
              break;
          }
          setError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000,
        }
      );
    });
  };

  return {
    location,
    error,
    permission,
    getCurrentLocation,
  };
};