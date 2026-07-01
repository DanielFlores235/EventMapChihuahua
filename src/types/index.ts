export interface Event {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  date: string;       // Formato YYYY-MM-DD
  category?: string;  // Opcional, para tus puntos extra
  distance?: string;  // Calculado por tu API cuando usas el endpoint /nearby
  address?: string;     // Dirección física o lugar
  start_time?: string;  // Hora de inicio
  end_time?: string;    // Hora de fin
}

export interface TouristSpot {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  description?: string;
  start_time?: string; // Hora de apertura
  end_time?: string;   // Hora de cierre
}