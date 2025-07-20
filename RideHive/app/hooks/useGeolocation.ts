import { useEffect, useState } from 'react';
import * as Location from 'expo-location';

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
    let subscription: Location.LocationSubscription | null = null;

    const setupLocation = async () => {
      try {
        // Request permission
        const { status } = await Location.requestForegroundPermissionsAsync();
        const hasPermission = status === 'granted';
        setPermission(hasPermission);

        if (!hasPermission) {
          setError('Location permission denied');
          return;
        }

        if (trackLocation) {
          // Start tracking location
          subscription = await Location.watchPositionAsync(
            {
              accuracy: Location.Accuracy.High,
              timeInterval: 5000, // Update every 5 seconds
              distanceInterval: 10, // Update every 10 meters
            },
            (locationUpdate) => {
              setLocation({
                latitude: locationUpdate.coords.latitude,
                longitude: locationUpdate.coords.longitude,
                accuracy: locationUpdate.coords.accuracy || undefined,
                timestamp: locationUpdate.timestamp,
              });
              setError(null);
            }
          );
        } else {
          // Get current location once
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          
          setLocation({
            latitude: currentLocation.coords.latitude,
            longitude: currentLocation.coords.longitude,
            accuracy: currentLocation.coords.accuracy || undefined,
            timestamp: currentLocation.timestamp,
          });
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get location');
      }
    };

    setupLocation();

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [trackLocation]);

  const getCurrentLocation = async (): Promise<LocationData | null> => {
    try {
      if (permission === false) {
        throw new Error('Location permission denied');
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const locationData = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        accuracy: currentLocation.coords.accuracy || undefined,
        timestamp: currentLocation.timestamp,
      };

      setLocation(locationData);
      setError(null);
      return locationData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get location';
      setError(errorMessage);
      return null;
    }
  };

  return {
    location,
    error,
    permission,
    getCurrentLocation,
  };
};