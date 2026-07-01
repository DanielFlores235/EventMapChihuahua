import { api } from './client';
import { TouristSpot } from '../types';

/**
 * Obtener todos los lugares turísticos (GET /spots)
 */
export const getAllSpots = async (): Promise<TouristSpot[]> => {
  const response = await api.get<TouristSpot[]>('/spots');
  return response.data;
};

/**
 * Registrar un nuevo lugar turístico (POST /spots)
 */
export const createSpot = async (spotData: Omit<TouristSpot, 'id'>): Promise<TouristSpot> => {
  const response = await api.post<TouristSpot>('/spots', spotData);
  return response.data;
};

/**
 * Actualizar un lugar turístico (PUT /spots/:id)
 */
export const updateSpot = async (id: number, spotData: Partial<TouristSpot>): Promise<TouristSpot> => {
  const response = await api.put<TouristSpot>(`/spots/${id}`, spotData);
  return response.data;
};

/**
 * Eliminar un lugar turístico (DELETE /spots/:id)
 */
export const deleteSpot = async (id: number): Promise<void> => {
  await api.delete(`/spots/${id}`);
};
