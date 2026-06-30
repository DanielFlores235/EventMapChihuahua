import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Importamos las pantallas
import MapScreen from './src/views/MapScreen';
import HomeScreen from './src/views/HomeScreen';
import EventDetailScreen from './src/views/EventDetailScreen';
import CreateEventScreen from './src/views/CreateEventScreen';
import { Event } from './src/types';

// Definimos los parámetros que recibe cada pantalla para TypeScript
export type RootStackParamList = {
  Map: undefined;
  Home: undefined;
  EventDetail: { event: Event };
  CreateEvent: { latitude?: number; longitude?: number } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Map">
        {/* Pantalla del Mapa */}
        <Stack.Screen 
          name="Map" 
          component={MapScreen} 
          options={{ title: 'Mapa de Eventos' }} 
        />
        
        {/* Pantalla de la Lista de Eventos */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Eventos Cercanos' }} 
        />
        
        {/* Pantalla de Detalles */}
        <Stack.Screen 
          name="EventDetail" 
          component={EventDetailScreen} 
          options={{ title: 'Detalles del Evento' }} 
        />

        {/* Pantalla para Crear Evento */}
        <Stack.Screen 
          name="CreateEvent" 
          component={CreateEventScreen} 
          options={{ title: 'Crear Nuevo Evento' }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}