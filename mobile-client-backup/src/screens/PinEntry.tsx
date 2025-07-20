import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { ridesAPI } from '../utils/api';

interface PinEntryProps {
  onJoinSuccess: (rideData: any) => void;
}

export const PinEntry: React.FC<PinEntryProps> = ({ onJoinSuccess }) => {
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoinRide = async () => {
    if (!pinCode.trim()) {
      Alert.alert('Error', 'Please enter a PIN code');
      return;
    }

    try {
      setLoading(true);
      const rideData = await ridesAPI.join(pinCode.trim());
      onJoinSuccess(rideData);
    } catch (error: any) {
      Alert.alert(
        'Failed to Join Ride',
        error.response?.data?.error || error.message || 'Unable to join ride'
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