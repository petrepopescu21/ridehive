import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { ridesAPI } from '../utils/api';
import { RideWithUsers } from '../../../shared/types';

interface PinEntryProps {
  onJoinSuccess: (rideData: RideWithUsers) => void;
}

export const PinEntry: React.FC<PinEntryProps> = ({ onJoinSuccess }) => {
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Test network connectivity on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🔍 [PinEntry] Testing network connectivity...');
        const isWeb = Platform.OS === 'web';
        const API_URL = isWeb && __DEV__ 
          ? 'http://localhost:3001' 
          : 'https://ridehive-app-d5258a8e7e80.herokuapp.com';
        
        console.log('🔧 [PinEntry] Using API URL:', API_URL, 'Platform:', Platform.OS, 'isWeb:', isWeb, '__DEV__:', __DEV__);
        const response = await fetch(`${API_URL}/health`);
        console.log('✅ [PinEntry] Health check response:', {
          status: response.status,
          ok: response.ok
        });
      } catch (error) {
        console.error('❌ [PinEntry] Network connectivity test failed:', error);
      }
    };
    
    testConnection();
  }, []);

  const handleJoinRide = async () => {
    if (!pinCode.trim()) {
      Alert.alert('Error', 'Please enter a PIN code');
      return;
    }

    try {
      setLoading(true);
      console.log('🔍 [PinEntry] Attempting to join ride with PIN:', pinCode.trim());
      
      const rideData = await ridesAPI.joinRide(pinCode.trim());
      
      console.log('✅ [PinEntry] Successfully joined ride:', rideData);
      onJoinSuccess(rideData);
    } catch (error: any) {
      console.error('❌ [PinEntry] Failed to join ride:', error);
      console.error('❌ [PinEntry] Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      Alert.alert(
        'Failed to Join Ride',
        error.message || 'Unable to join ride. Check console for details.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Join a Ride</Text>
          <Text style={styles.subtitle}>
            Enter the PIN code provided by the ride organizer
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>PIN Code</Text>
          <TextInput
            style={styles.input}
            value={pinCode}
            onChangeText={setPinCode}
            placeholder="Enter 6-digit PIN"
            keyboardType="numeric"
            maxLength={6}
            autoFocus
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, (!pinCode.trim() || loading) && styles.buttonDisabled]}
            onPress={handleJoinRide}
            disabled={!pinCode.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Join Ride</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.info}>
          <Text style={styles.infoText}>
            • Ask the ride organizer for the PIN code
          </Text>
          <Text style={styles.infoText}>
            • Make sure location services are enabled
          </Text>
          <Text style={styles.infoText}>
            • Stay connected to share your location with the group
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 16,
    fontSize: 18,
    backgroundColor: 'white',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 2,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  info: {
    padding: 20,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  infoText: {
    fontSize: 14,
    color: '#1e40af',
    marginBottom: 4,
  },
});