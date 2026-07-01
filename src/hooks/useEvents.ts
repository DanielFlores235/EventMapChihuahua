import { useState, useCallback } from 'react';
import { Event } from '../types';
import { getNearbyEvents, getAllEvents, createEvent as createEventApi, updateEvent as updateEventApi, deleteEvent as deleteEventApi } from '../api/events';

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

  const loadAllEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const data = await getAllEvents();
      setEvents(data);
    } catch (error) {
      setEventsError('No se pudieron cargar los eventos. Verifica tu conexión.');
    } finally {
      setIsLoadingEvents(false);
    }
  }, []);

  const createEvent = async (eventData: Omit<Event, 'id'>) => {
    try {
      const newEvent = await createEventApi(eventData);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  };

  const updateEvent = async (id: number, eventData: Omit<Event, 'id'>) => {
    try {
      const updated = await updateEventApi(id, eventData);
      setEvents(prev => prev.map(e => e.id === id ? updated : e));
      return updated;
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await deleteEventApi(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  };

  // Retornamos lo necesario para que las pantallas lo consuman
  return { 
    events, 
    isLoadingEvents, 
    eventsError, 
    loadNearbyEvents,
    loadAllEvents,
    createEvent,
    updateEvent,
    deleteEvent
  };
};