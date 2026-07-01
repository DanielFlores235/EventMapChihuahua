import { api } from './client';
import { Event } from '../types';

/**
 * Obtener todos los eventos (GET /events)
 */
export const getAllEvents = async (): Promise<Event[]> => {
  const response = await api.get<Event[]>('/events');
  return response.data;
};

/**
 * Obtener eventos cercanos basados en el GPS (GET /events/nearby)
 */
export const getNearbyEvents = async (lat: number, lng: number): Promise<Event[]> => {
  const response = await api.get<Event[]>(`/events/nearby?lat=${lat}&lng=${lng}`);
  return response.data;
};

/**
 * Registrar un nuevo evento (POST /events)
 */
export const createEvent = async (eventData: Omit<Event, 'id'>): Promise<Event> => {
  const response = await api.post<Event>('/events', eventData);
  return response.data;
};

/**
 * Actualizar un evento (PUT /events/:id)
 */
export const updateEvent = async (id: number, eventData: Partial<Event>): Promise<Event> => {
  const response = await api.put<Event>(`/events/${id}`, eventData);
  return response.data;
};

/**
 * Eliminar un evento (DELETE /events/:id)
 */
export const deleteEvent = async (id: number): Promise<void> => {
  await api.delete(`/events/${id}`);
};

/**
 * Obtener eventos por categoría (GET /events/category/:category)
 */
export const getEventsByCategory = async (category: string): Promise<Event[]> => {
  const response = await api.get<Event[]>(`/events/category/${category}`);
  return response.data;
};

/**
 * Geocodificación directa: Convierte un texto a coordenadas usando OpenStreetMap Nominatim
 */
export const geocodeAddress = async (address: string): Promise<{ latitude: number, longitude: number, address: string }> => {
  // Se recomienda incluir "Chihuahua" para priorizar resultados locales si es específico de la ciudad
  const query = address.toLowerCase().includes('chihuahua') ? address : `${address}, Chihuahua`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  
  const response = await fetch(url, { headers: { 'User-Agent': 'EventMapChihuahuaApp/1.0' } });
  const data = await response.json();
  
  if (data && data.length > 0) {
    return {
      latitude: parseFloat(data[0].lat),
      longitude: parseFloat(data[0].lon),
      address: data[0].display_name
    };
  }
  throw new Error('Dirección no encontrada');
};

/**
 * Geocodificación inversa: Convierte coordenadas a texto usando OpenStreetMap Nominatim
 */
export const reverseGeocode = async (latitude: number, longitude: number): Promise<{ address: string }> => {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
  
  const response = await fetch(url, { headers: { 'User-Agent': 'EventMapChihuahuaApp/1.0' } });
  const data = await response.json();
  
  if (data && data.display_name) {
    return { address: data.display_name };
  }
  throw new Error('Dirección no encontrada');
};