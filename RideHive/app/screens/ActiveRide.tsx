import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { useSocket } from '../hooks/useSocket';
import { useGeolocation } from '../hooks/useGeolocation';
import { RideWithUsers, Waypoint, ActiveUser } from '../../../shared/types';
import { USER_COLORS } from '../../../shared/constants';

const { width, height } = Dimensions.get('window');

interface ActiveRideProps {
  ride: RideWithUsers;
  userId: string;
  onLeaveRide: () => void;
}

export const ActiveRide: React.FC<ActiveRideProps> = ({ ride, userId, onLeaveRide }) => {
  console.log('🎬 ActiveRide rendered with:', { rideId: ride.id, userId });
  const { isConnected, activeUsers, sendLocationUpdate } = useSocket(ride.id, userId);
  const { location, error: locationError, permission } = useGeolocation(true);
  
  console.log('🗺️ ActiveRide state:', { 
    isConnected, 
    activeUsersCount: Object.keys(activeUsers).length,
    hasLocation: !!location,
    locationError,
    permission 
  });
  const [mapRegion, setMapRegion] = useState({
    latitude: ride.waypoints?.[0]?.lat || 44.4268,
    longitude: ride.waypoints?.[0]?.lng || 26.1025,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  // Send location updates
  useEffect(() => {
    console.log('📱 Location/connection state changed:', { 
      hasLocation: !!location, 
      isConnected,
      lat: location?.latitude,
      lng: location?.longitude 
    });
    if (location && isConnected) {
      console.log('📍 Sending location from ActiveRide');
      sendLocationUpdate(location.latitude, location.longitude);
    }
  }, [location, isConnected, sendLocationUpdate]);

  // Handle location permission issues
  useEffect(() => {
    if (permission === false) {
      console.log('❌ Location permission denied');
      if (Platform.OS === 'web') {
        // Use native alert for web
        if (window.confirm('Location Permission Required. Please enable location services to share your position with the group. Leave ride?')) {
          onLeaveRide();
        }
      } else {
        // Use React Native Alert for mobile
        Alert.alert(
          'Location Permission Required',
          'Please enable location services to share your position with the group.',
          [
            { text: 'Leave Ride', style: 'destructive', onPress: onLeaveRide },
          ]
        );
      }
    }
  }, [permission, onLeaveRide]);

  const handleLeaveRide = () => {
    if (Platform.OS === 'web') {
      // Use native confirm for web
      if (window.confirm('Are you sure you want to leave this ride?')) {
        onLeaveRide();
      }
    } else {
      // Use React Native Alert for mobile
      Alert.alert(
        'Leave Ride',
        'Are you sure you want to leave this ride?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Leave', style: 'destructive', onPress: onLeaveRide },
        ]
      );
    }
  };

  const getMarkerColor = (user: ActiveUser) => {
    return user.role === 'organizer' ? USER_COLORS.ORGANIZER : USER_COLORS.RIDER;
  };

  const renderUserMarkers = () => {
    return Object.entries(activeUsers).map(([id, user]) => {
      if (!user.lat || !user.lng) return null;
      
      return (
        <Marker
          key={id}
          coordinate={{ latitude: user.lat, longitude: user.lng }}
          title={id === userId ? 'You' : `${user.role === 'organizer' ? 'Organizer' : 'Rider'}`}
          description={`Last seen: ${new Date(user.lastSeen).toLocaleTimeString()}`}
          pinColor={getMarkerColor(user)}
        />
      );
    });
  };

  const renderWaypointMarkers = () => {
    if (!ride.waypoints) return null;
    
    return ride.waypoints.map((waypoint: Waypoint, index: number) => (
      <Marker
        key={`waypoint-${index}`}
        coordinate={{ latitude: waypoint.lat, longitude: waypoint.lng }}
        title={waypoint.name}
        pinColor="#10b981" // green for waypoints
      />
    ));
  };

  const renderRoute = () => {
    // Use saved route coordinates if available, otherwise fall back to waypoints
    let coordinates;
    
    if (ride.route_coordinates && ride.route_coordinates.length > 0) {
      // Use the precalculated route from the database (calculated via OpenRouteService)
      console.log('🗺️ Using precalculated route with', ride.route_coordinates.length, 'points');
      coordinates = ride.route_coordinates.map(coord => ({
        latitude: coord.lat,
        longitude: coord.lng,
      }));
    } else if (ride.waypoints && ride.waypoints.length >= 2) {
      // Fallback to connecting waypoints directly (simple straight lines)
      console.log('🗺️ Using direct waypoint connections as fallback');
      coordinates = ride.waypoints.map(wp => ({
        latitude: wp.lat,
        longitude: wp.lng,
      }));
    } else {
      console.log('🗺️ No route data available');
      return null;
    }

    return (
      <Polyline
        coordinates={coordinates}
        strokeColor="#3b82f6"
        strokeWidth={3}
        strokeOpacity={0.8}
      />
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{ride.title || 'Active Ride'}</Text>
          <Text style={styles.pinCode}>
            {ride.rider_pin && ride.organizer_pin ? (
              `Rider PIN: ${ride.rider_pin} | Organizer PIN: ${ride.organizer_pin}`
            ) : (
              `PIN: ${(ride as any).pin_code || 'N/A'}`
            )}
          </Text>
        </View>
        <View style={styles.statusContainer}>
          <View style={[styles.statusDot, { backgroundColor: isConnected ? '#10b981' : '#ef4444' }]} />
          <Text style={styles.statusText}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </View>
      </View>

      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          onRegionChangeComplete={setMapRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          mapType="standard"
        >
          {renderWaypointMarkers()}
          {renderRoute()}
          {renderUserMarkers()}
        </MapView>
      </View>

      <View style={styles.footer}>
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>
            Active Users: {Object.keys(activeUsers).length}
          </Text>
          {locationError && (
            <Text style={styles.errorText}>Location: {locationError}</Text>
          )}
        </View>
        
        <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveRide}>
          <Text style={styles.leaveButtonText}>Leave Ride</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
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
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  pinCode: {
    fontSize: 14,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  statusContainer: {
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
  mapContainer: {
    flex: 1,
  },
  map: {
    width: width,
    height: height - 200, // Account for header and footer
  },
  footer: {
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
  },
  leaveButton: {
    backgroundColor: '#ef4444',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});