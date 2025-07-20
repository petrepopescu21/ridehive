import React, { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { PinEntry } from '../screens/PinEntry';
import { ActiveRide } from '../screens/ActiveRide';
import { RideWithUsers } from '../../../shared/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const [currentRide, setCurrentRide] = useState<RideWithUsers | null>(null);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    // Generate or load user ID
    const loadUserId = async () => {
      try {
        let storedUserId = await AsyncStorage.getItem('ridehive_user_id');
        if (!storedUserId) {
          storedUserId = `rider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await AsyncStorage.setItem('ridehive_user_id', storedUserId);
        }
        setUserId(storedUserId);
      } catch (error) {
        // Fallback to session-only ID
        setUserId(`rider_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      }
    };

    loadUserId();
  }, []);

  const handleJoinSuccess = (rideData: RideWithUsers) => {
    setCurrentRide(rideData);
  };

  const handleLeaveRide = () => {
    setCurrentRide(null);
  };

  if (!userId) {
    return null; // Loading state
  }

  if (currentRide) {
    return (
      <ActiveRide
        ride={currentRide}
        userId={userId}
        onLeaveRide={handleLeaveRide}
      />
    );
  }

  return <PinEntry onJoinSuccess={handleJoinSuccess} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
});
