import { api } from './client';

export interface TransportRoute {
  id: number;
  name: string;
  origin: string;
  destination: string;
  path_coordinates?: string;
  start_time?: string;
  end_time?: string;
  frequency_mins?: number;
}

export interface TransportStop {
  id: number;
  route_id: number;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
}

export interface NearestTransport {
  id: number;
  route_id: number;
  name: string;
  latitude: number;
  longitude: number;
  order_index: number;
  route_name: string;
  distance_meters: number;
  walking_time_mins: number;
}

export const getAllRoutes = async (): Promise<TransportRoute[]> => {
  const response = await api.get<TransportRoute[]>('/transport/routes');
  return response.data;
};

export const getStopsByRoute = async (routeId?: number): Promise<TransportStop[]> => {
  const ts = new Date().getTime();
  const url = routeId ? `/transport/stops?route_id=${routeId}&_t=${ts}` : `/transport/stops?_t=${ts}`;
  const response = await api.get<TransportStop[]>(url);
  return response.data;
};

export const getNearestTransport = async (
  userLat: number, 
  userLng: number, 
  destLat: number, 
  destLng: number
): Promise<NearestTransport> => {
  const response = await api.get<NearestTransport>(
    `/transport/nearest?user_lat=${userLat}&user_lng=${userLng}&dest_lat=${destLat}&dest_lng=${destLng}`
  );
  return response.data;
};

export const createRouteApi = async (
  name: string, 
  origin: string, 
  destination: string, 
  stops: any[] = [],
  start_time: string = '06:00',
  end_time: string = '22:00',
  frequency_mins: number = 15
) => {
  const response = await api.post('/transport/routes', { name, origin, destination, stops, start_time, end_time, frequency_mins });
  return response.data;
};

export const deleteRouteApi = async (id: number) => {
  const response = await api.delete(`/transport/routes/${id}`);
  return response.data;
};
