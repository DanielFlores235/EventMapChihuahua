import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

// Importamos las pantallas
import MapScreen from './src/views/MapScreen';
import HomeScreen from './src/views/HomeScreen';
import EventDetailScreen from './src/views/EventDetailScreen';
import CreateEventScreen from './src/views/CreateEventScreen';
import { Event } from './src/types';

// Definimos los parámetros que recibe cada pantalla para TypeScript
export type RootStackParamList = {
  MainDrawer: undefined;
  EventDetail: { event: Event };
  CreateEvent: { latitude?: number; longitude?: number } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator();

// Opciones globales para el Modo Oscuro
const darkHeaderOptions = {
  headerStyle: { backgroundColor: '#0F172A' },
  headerTintColor: '#F8FAFC',
  headerTitleStyle: { fontWeight: 'bold' as const },
};

// Menú lateral que contiene las pantallas principales
function DrawerGroup() {
  return (
    <Drawer.Navigator 
      initialRouteName="Map"
      screenOptions={{
        ...darkHeaderOptions,
        drawerStyle: { backgroundColor: '#1E293B' },
        drawerActiveTintColor: '#3B82F6',
        drawerInactiveTintColor: '#CBD5E1',
      }}
    >
      <Drawer.Screen 
        name="Map" 
        component={MapScreen} 
        options={{ 
          title: 'Mapa de Lugares Turisticos de Chihuahua',
          drawerIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />
        }} 
      />
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Lista de Eventos',
          drawerIcon: ({ color, size }) => <Ionicons name="list" size={size} color={color} />
        }} 
      />
    </Drawer.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={darkHeaderOptions}>
        <Stack.Screen 
          name="MainDrawer" 
          component={DrawerGroup} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="EventDetail" 
          component={EventDetailScreen} 
          options={{ title: 'Detalles del Evento' }} 
        />
        <Stack.Screen 
          name="CreateEvent" 
          component={CreateEventScreen} 
          options={{ title: 'Nuevo Evento' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}