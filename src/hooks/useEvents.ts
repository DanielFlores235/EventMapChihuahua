import { useState, useCallback } from 'react';
import { Event } from '../types';
import { getNearbyEvents } from '../api/events';

export const useEvents = () => {
  // Estados para almacenar la data, el progreso y los errores
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false);
  const [eventsError, setEventsError] = useState<string | null>(null);

  // Usamos useCallback para memorizar la función y evitar re-renders innecesarios en React
  const loadNearbyEvents = useCallback(async (lat: number, lng: number) => {
    setIsLoadingEvents(true);
    setEventsError(null);
    
    try {
      // Llamamos a la función de Axios que creamos en el paso anterior
      const data = await getNearbyEvents(lat, lng);
      setEvents(data);
    } catch (error) {
      setEventsError('No se pudieron cargar los eventos de Chihuahua. Verifica tu conexión.');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  // Retornamos lo necesario para que las pantallas lo consuman
  return { 
    events, 
    isLoadingEvents, 
    eventsError, 
    loadNearbyEvents 
  };
};