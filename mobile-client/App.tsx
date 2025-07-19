import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { PinEntry } from './src/screens/PinEntry';
import { ActiveRide } from './src/screens/ActiveRide';

type RootStackParamList = {
  PinEntry: undefined;
  ActiveRide: { rideId: number; userId: string; rideTitle: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PinEntry"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen
          name="PinEntry"
          component={PinEntryScreen}
        />
        <Stack.Screen
          name="ActiveRide"
          component={ActiveRideScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function PinEntryScreen({ navigation }: any) {
  const handleJoinSuccess = (rideData: any) => {
    navigation.navigate('ActiveRide', {
      rideId: rideData.id,
      userId: rideData.userId,
      rideTitle: rideData.title,
    });
  };

  return <PinEntry onJoinSuccess={handleJoinSuccess} />;
}

function ActiveRideScreen({ route, navigation }: any) {
  const { rideId, userId, rideTitle } = route.params;

  const handleLeaveRide = () => {
    navigation.navigate('PinEntry');
  };

  return (
    <ActiveRide
      rideId={rideId}
      userId={userId}
      onLeaveRide={handleLeaveRide}
    />
  );
}