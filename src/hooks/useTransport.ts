import { useState, useCallback, useEffect } from 'react';
import { getAllRoutes, getStopsByRoute, getNearestTransport, createRouteApi, deleteRouteApi, TransportRoute, TransportStop, NearestTransport } from '../api/transport';

export const useTransport = () => {
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [stops, setStops] = useState<TransportStop[]>([]);
  const [isLoadingTransport, setIsLoadingTransport] = useState(false);
  const [transportError, setTransportError] = useState<string | null>(null);

  const loadRoutes = useCallback(async () => {
    setIsLoadingTransport(true);
    setTransportError(null);
    try {
      const data = await getAllRoutes();
      setRoutes(data);
    } catch (err) {
      console.error('Error al cargar rutas de transporte:', err);
      setTransportError('No se pudieron cargar las rutas.');
    } finally {
      setIsLoadingTransport(false);
    }
  }, []);

  const loadStops = useCallback(async (routeId?: number) => {
    setIsLoadingTransport(true);
    try {
      const data = await getStopsByRoute(routeId);
      setStops(data);
    } catch (err) {
      console.error('Error al cargar paradas:', err);
    } finally {
      setIsLoadingTransport(false);
    }
  }, []);

  const calculateNearestRoute = async (userLat: number, userLng: number, destLat: number, destLng: number): Promise<NearestTransport | null> => {
    try {
      return await getNearestTransport(userLat, userLng, destLat, destLng);
    } catch (err) {
      console.error('Error calculando la parada más cercana:', err);
      return null;
    }
  };

  const createRoute = async (
    name: string, 
    origin: string, 
    destination: string, 
    stops: any[] = [],
    start_time: string = '06:00',
    end_time: string = '22:00',
    frequency_mins: number = 15
  ) => {
    await createRouteApi(name, origin, destination, stops, start_time, end_time, frequency_mins);
    await loadRoutes();
  };

  const deleteRoute = async (id: number) => {
    await deleteRouteApi(id);
    await loadRoutes();
  };

  useEffect(() => {
    loadRoutes();
  }, [loadRoutes]);

  return {
    routes,
    stops,
    isLoadingTransport,
    transportError,
    loadRoutes,
    loadStops,
    calculateNearestRoute,
    createRoute,
    deleteRoute
  };
};
