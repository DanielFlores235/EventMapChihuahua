import { useState, useEffect } from 'react';
import * as Location from 'expo-location';

export const useLocation = () => {
  // Estados para manejar la ubicación, posibles errores y el tiempo de carga
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      // Coordenadas por defecto (Centro de Chihuahua)
      const defaultLocation: any = {
        coords: { latitude: 28.6353, longitude: -106.0889, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
        timestamp: Date.now(),
      };

      try {
        // 1. Solicitar permisos de ubicación en primer plano
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status !== 'granted') {
          console.warn('Permiso para ubicación denegado. Usando ubicación por defecto.');
          setLocation(defaultLocation);
          setIsLoading(false);
          return;
        }

        // 2. Obtener la ubicación inicial rápido para no hacer esperar al usuario
        const initialLocation = await Location.getCurrentPositionAsync({});
        setLocation(initialLocation);
        setIsLoading(false);

        // 3. Suscribirse a los cambios de ubicación en TIEMPO REAL
        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Actualizar cada 3 segundos
            distanceInterval: 5, // o cada 5 metros de movimiento
          },
          (newLocation) => {
            setLocation(newLocation);
          }
        );
        
      } catch (error) {
        console.warn('Ocurrió un error al intentar obtener la ubicación. Usando ubicación por defecto.', error);
        setLocation(defaultLocation);
        setIsLoading(false);
      }
    };

    startWatching();

    // Función de limpieza: detener el seguimiento cuando el componente se desmonte
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return { location, errorMsg, isLoading };
};