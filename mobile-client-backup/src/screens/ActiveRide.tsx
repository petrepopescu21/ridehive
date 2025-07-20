import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import { ridesAPI } from '../utils/api';
import { LOCATION_UPDATE_INTERVAL, USER_COLORS } from '../../../shared/constants';
import type { Ride, ActiveUser } from '../../../shared/types';

interface ActiveRideProps {
  rideId: number;
  userId: string;
  onLeaveRide: () => void;
}

export const ActiveRide: React.FC<ActiveRideProps> = ({ rideId, userId, onLeaveRide }) => {
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { 
    connected, 
    activeUsers, 
    updateLocation,
    error: socketError 
  } = useSocket({ 
    rideId, 
    userId, 
    enabled: true 
  });

  const { 
    latitude, 
    longitude, 
    accuracy,
    error: locationError,
    hasPermission,
    startWatching,
    stopWatching 
  } = useGeolocation({ 
    watchPosition: true,
    enableHighAccuracy: true 
  });

  // Load ride details
  const loadRide = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const rideData = await ridesAPI.getById(rideId);
      setRide(rideData);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to load ride');
    } finally {
      setLoading(false);
    }
  }, [rideId]);

  // Send location updates
  useEffect(() => {
    if (!connected || !userId || latitude === null || longitude === null) return;

    const interval = setInterval(() => {
      updateLocation(rideId, userId, latitude, longitude);
    }, LOCATION_UPDATE_INTERVAL);

    // Send initial location immediately
    updateLocation(rideId, userId, latitude, longitude);

    return () => clearInterval(interval);
  }, [connected, userId, latitude, longitude, rideId, updateLocation]);

  const handleLeaveRide = () => {
    Alert.alert(
      'Leave Ride',
      'Are you sure you want to leave this ride?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Leave', 
          style: 'destructive',
          onPress: () => {
            stopWatching();
            onLeaveRide();
          }
        },
      ]
    );
  };

  useEffect(() => {
    loadRide();
  }, [loadRide]);

  useEffect(() => {
    startWatching();
    
    return () => {
      stopWatching();
    };
  }, [startWatching, stopWatching]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading ride...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Ride not found</Text>
          <TouchableOpacity style={styles.button} onPress={onLeaveRide}>
            <Text style={styles.buttonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const activeUserCount = Object.keys(activeUsers).length;
  const hasWaypoints = ride.waypoints && ride.waypoints.length > 0;
  
  // Calculate map region based on waypoints or current location
  const mapRegion = hasWaypoints ? {
    latitude: ride.waypoints!.reduce((sum, wp) => sum + wp.lat, 0) / ride.waypoints!.length,
    longitude: ride.waypoints!.reduce((sum, wp) => sum + wp.lng, 0) / ride.waypoints!.length,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : latitude && longitude ? {
    latitude,
    longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : {
    latitude: 40.7128,
    longitude: -74.0060,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title} numberOfLines={1}>{ride.title}</Text>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: connected ? '#10b981' : '#ef4444' }]} />
            <Text style={styles.statusText}>
              {connected ? 'Connected' : 'Disconnected'}
            </Text>
            <Text style={styles.participantCount}>
              • {activeUserCount} participant{activeUserCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRide}>
          <Text style={styles.leaveButtonText}>Leave</Text>
        </TouchableOpacity>
      </View>

      {/* Error Messages */}
      {(error || socketError || locationError) && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>
            {error || socketError || locationError}
          </Text>
        </View>
      )}

      {/* Location Permission Warning */}
      {!hasPermission && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningText}>
            Location permission is required to share your position
          </Text>
        </View>
      )}

      {/* Map */}
      <View style={styles.mapContainer}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={mapRegion}
          showsUserLocation={hasPermission}
          showsMyLocationButton={hasPermission}
          followsUserLocation={false}
        >
          {/* Route polyline */}
          {hasWaypoints && ride.waypoints!.length > 1 && (
            <Polyline
              coordinates={ride.waypoints!.map(wp => ({ latitude: wp.lat, longitude: wp.lng }))}
              strokeColor="#3b82f6"
              strokeWidth={3}
            />
          )}
          
          {/* Waypoint markers */}
          {hasWaypoints && ride.waypoints!.map((waypoint, index) => (
            <Marker
              key={`waypoint-${index}`}
              coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
              title={waypoint.name}
              description={`Waypoint ${index + 1}`}
              pinColor="#6366f1"
            />
          ))}
          
          {/* Active user markers */}
          {Object.entries(activeUsers).map(([userId, user]) => {
            if (user.lat === null || user.lng === null) return null;
            
            return (
              <Marker
                key={`user-${userId}`}
                coordinate={{ latitude: user.lat, longitude: user.lng }}
                title={user.role === 'organizer' ? 'Organizer' : 'Rider'}
                description={`Last seen: ${new Date(user.lastSeen).toLocaleTimeString()}`}
                pinColor={user.role === 'organizer' ? '#dc2626' : '#2563eb'}
              />
            );
          })}
        </MapView>
      </View>

      {/* Bottom panel */}
      <View style={styles.bottomPanel}>
        <ScrollView style={styles.participantsList} showsVerticalScrollIndicator={false}>
          <Text style={styles.participantsTitle}>Participants ({activeUserCount})</Text>
          
          {activeUserCount === 0 ? (
            <Text style={styles.noParticipants}>No other participants</Text>
          ) : (
            Object.entries(activeUsers).map(([userId, user]) => (
              <View key={userId} style={styles.participantItem}>
                <View style={[
                  styles.participantDot, 
                  { backgroundColor: user.role === 'organizer' ? USER_COLORS.ORGANIZER : USER_COLORS.RIDER }
                ]} />
                <View style={styles.participantInfo}>
                  <Text style={styles.participantRole} numberOfLines={1}>
                    {user.role === 'organizer' ? 'Organizer' : 'Rider'}
                  </Text>
                  <Text style={styles.participantTime}>
                    {new Date(user.lastSeen).toLocaleTimeString()}
                  </Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {hasPermission && latitude && longitude && (
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>
              Your location: {latitude.toFixed(4)}, {longitude.toFixed(4)}
            </Text>
            {accuracy && (
              <Text style={styles.accuracyText}>
                Accuracy: ±{Math.round(accuracy)}m
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ef4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
  },
  participantCount: {
    fontSize: 12,
    color: '#6b7280',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorBannerText: {
    fontSize: 14,
    color: '#dc2626',
  },
  warningBanner: {
    backgroundColor: '#fef3cd',
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b',
  },
  warningText: {
    fontSize: 14,
    color: '#d97706',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  bottomPanel: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    maxHeight: 200,
  },
  participantsList: {
    padding: 16,
  },
  participantsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  noParticipants: {
    fontSize: 14,
    color: '#6b7280',
    fontStyle: 'italic',
  },
  participantItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  participantDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  participantTime: {
    fontSize: 12,
    color: '#6b7280',
  },
  locationInfo: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    backgroundColor: '#f9fafb',
  },
  locationText: {
    fontSize: 12,
    color: '#4b5563',
  },
  accuracyText: {
    fontSize: 12,
    color: '#6b7280',
  },
  button: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});