export interface Event {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  date: string;       // Formato YYYY-MM-DD
  category?: string;  // Opcional, para tus puntos extra
  distance?: string;  // Calculado por tu API cuando usas el endpoint /nearby
}