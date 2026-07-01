import { useState, useEffect, useCallback } from 'react';
import { TouristSpot } from '../types';
import { getAllSpots, createSpot as createSpotApi, updateSpot as updateSpotApi, deleteSpot as deleteSpotApi } from '../api/spots';

export const useSpots = () => {
  const [spots, setSpots] = useState<TouristSpot[]>([]);
  const [isLoadingSpots, setIsLoadingSpots] = useState(false);
  const [errorSpots, setErrorSpots] = useState<string | null>(null);

  const loadSpots = useCallback(async () => {
    setIsLoadingSpots(true);
    setErrorSpots(null);
    try {
      const data = await getAllSpots();
      setSpots(data);
    } catch (err) {
      console.error('Error cargando lugares turísticos:', err);
      setErrorSpots('No se pudieron cargar los lugares turísticos.');
    } finally {
      setIsLoadingSpots(false);
    }
  }, []);

  useEffect(() => {
    loadSpots();
  }, [loadSpots]);

  const createSpot = async (spotData: Omit<TouristSpot, 'id'>) => {
    try {
      const newSpot = await createSpotApi(spotData);
      setSpots(prev => [...prev, newSpot]);
      return newSpot;
    } catch (err) {
      console.error('Error creating spot:', err);
      throw err;
    }
  };

  const updateSpot = async (id: number, spotData: Partial<TouristSpot>) => {
    try {
      const updated = await updateSpotApi(id, spotData);
      setSpots(prev => prev.map(s => s.id === id ? updated : s));
      return updated;
    } catch (err) {
      console.error('Error updating spot:', err);
      throw err;
    }
  };

  const deleteSpot = async (id: number) => {
    try {
      await deleteSpotApi(id);
      setSpots(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error('Error deleting spot:', err);
      throw err;
    }
  };

  return {
    spots,
    isLoadingSpots,
    errorSpots,
    loadSpots,
    createSpot,
    updateSpot,
    deleteSpot
  };
};
