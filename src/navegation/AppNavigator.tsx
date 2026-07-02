import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MapScreen from '../views/MapScreen';
import CreateEventScreen from '../views/CreateEventScreen';
import EventDetailScreen from '../views/EventDetailScreen';
import IntroScreen from '../views/IntroScreen';

import SpotDetailScreen from '../views/SpotDetailScreen';
import CreateTransportScreen from '../views/CreateTransportScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <Stack.Navigator initialRouteName="Intro" screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Intro" component={IntroScreen} />
      <Stack.Screen name="Map" component={MapScreen} />
      <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} />
      <Stack.Screen name="SpotDetail" component={SpotDetailScreen} />
      <Stack.Screen name="CreateTransport" component={CreateTransportScreen} />
    </Stack.Navigator>
  );
}