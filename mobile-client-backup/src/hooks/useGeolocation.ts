import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from 'react-native-geolocation-service';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  hasPermission: boolean;
}

interface UseGeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  distanceFilter?: number;
  watchPosition?: boolean;
}

export const useGeolocation = (options: UseGeolocationOptions = {}) => {
  const {
    enableHighAccuracy = true,
    timeout = 15000,
    maximumAge = 10000,
    distanceFilter = 10,
    watchPosition = false,
  } = options;

  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    hasPermission: false,
  });

  const [watchId, setWatchId] = useState<number | null>(null);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    if (Platform.OS === 'ios') {
      try {
        const result = await Geolocation.requestAuthorization('whenInUse');
        return result === 'granted';
      } catch (error) {
        return false;
      }
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'This app needs access to location to share your position with other riders.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (error) {
        return false;
      }
    }

    return false;
  }, []);

  const updatePosition = useCallback((position: Geolocation.GeoPosition) => {
    setState(prev => ({
      ...prev,
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      error: null,
      loading: false,
    }));
  }, []);

  const updateError = useCallback((error: Geolocation.GeoError) => {
    let errorMessage = 'Failed to get location';
    
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        errorMessage = 'Location access denied. Please enable location permissions.';
        break;
      case 2: // POSITION_UNAVAILABLE
        errorMessage = 'Location information unavailable';
        break;
      case 3: // TIMEOUT
        errorMessage = 'Location request timed out';
        break;
    }

    setState(prev => ({
      ...prev,
      error: errorMessage,
      loading: false,
    }));
  }, []);

  const getCurrentPosition = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      setState(prev => ({
        ...prev,
        error: 'Location permission denied',
        hasPermission: false,
        loading: false,
      }));
      return;
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      hasPermission: true 
    }));

    Geolocation.getCurrentPosition(
      updatePosition,
      updateError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
      }
    );
  }, [enableHighAccuracy, timeout, maximumAge, updatePosition, updateError, requestLocationPermission]);

  const startWatching = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    
    if (!hasPermission) {
      setState(prev => ({
        ...prev,
        error: 'Location permission denied',
        hasPermission: false,
      }));
      Alert.alert(
        'Location Permission Required',
        'Please enable location permissions in your device settings to share your location with other riders.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
    }

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      hasPermission: true 
    }));

    const id = Geolocation.watchPosition(
      updatePosition,
      updateError,
      {
        enableHighAccuracy,
        timeout,
        maximumAge,
        distanceFilter,
        interval: 5000,
        fastestInterval: 2000,
      }
    );

    setWatchId(id);
  }, [enableHighAccuracy, timeout, maximumAge, distanceFilter, updatePosition, updateError, requestLocationPermission, watchId]);

  const stopWatching = useCallback(() => {
    if (watchId !== null) {
      Geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  useEffect(() => {
    if (watchPosition) {
      startWatching();
    } else {
      getCurrentPosition();
    }

    return () => {
      stopWatching();
    };
  }, [watchPosition, startWatching, getCurrentPosition, stopWatching]);

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        Geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return {
    ...state,
    getCurrentPosition,
    startWatching,
    stopWatching,
    isWatching: watchId !== null,
  };
};