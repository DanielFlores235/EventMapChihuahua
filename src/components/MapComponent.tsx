import React, { useState, useEffect, forwardRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, UrlTile, Polyline } from 'react-native-maps';
import { Event, TouristSpot } from '../types';
import { TransportStop, TransportRoute } from '../api/transport';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';

interface MapComponentProps {
  initialRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  userLocation: { latitude: number; longitude: number } | null;
  events: Event[];
  touristSpots?: TouristSpot[];
  transportStops?: TransportStop[];
  transportRoutes?: TransportRoute[];
  onSelectEvent: (event: Event) => void;
  onSelectSpot?: (spot: TouristSpot) => void;
  onSelectTransportStop?: (stop: TransportStop) => void;
  onMapPress?: (coords: { latitude: number; longitude: number }) => void;
  selectedCoords?: { latitude: number; longitude: number } | null;
  selectedRouteId?: number | null;
  selectedTransportStopId?: number | null;
  simulatedLocation?: { latitude: number; longitude: number } | null;
  onSimulatedLocationChange?: (coords: { latitude: number; longitude: number }) => void;
}

const MapComponent = forwardRef<MapView, MapComponentProps>(({
  initialRegion,
  userLocation,
  events,
  touristSpots = [],
  transportStops = [],
  transportRoutes = [],
  onSelectEvent,
  onSelectSpot,
  onSelectTransportStop,
  onMapPress,
  selectedCoords,
  selectedRouteId,
  selectedTransportStopId,
  simulatedLocation,
  onSimulatedLocationChange
}, ref) => {
  
  const [busIndex, setBusIndex] = useState(0);

  useEffect(() => {
    // Animación matemática: Avanza el autobús sobre la polilínea cada 2.5 segundos
    const interval = setInterval(() => {
      setBusIndex((prev) => prev + 1);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const getCategoryConfig = (category?: string) => {
    switch (category) {
      case 'Música': return { color: '#A855F7', icon: 'music' };
      case 'Deportes': return { color: '#F97316', icon: 'football-ball' };
      case 'Cultura': return { color: '#EC4899', icon: 'palette' };
      case 'Tecnología': return { color: '#06B6D4', icon: 'microchip' };
      default: return { color: '#EF4444', icon: 'ticket-alt' };
    }
  };
  return (
    <View style={styles.container}>
      <MapView
        ref={ref}
        style={styles.map}
        initialRegion={initialRegion}
        mapType="none" // Para que muestre solo la capa de OpenStreetMap
        showsUserLocation={true}
        showsMyLocationButton={false}
        onPress={(e) => {
          if (onMapPress) {
            onMapPress(e.nativeEvent.coordinate);
          }
        }}
      >
        {/* Capa Dark Matter (CartoDB) para Urban Command */}
        <UrlTile
          urlTemplate="https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Marcador de Ubicación del Usuario (Nativo o GPS) */}
        {userLocation && !simulatedLocation && (
          <Marker coordinate={userLocation} title="Tu ubicación" zIndex={1000}>
            <View style={styles.userMarkerOuter}>
              <View style={styles.userMarkerInner} />
            </View>
          </Marker>
        )}

        {/* PUNTO DE SIMULACIÓN ARRASTRABLE */}
        {simulatedLocation && (
          <Marker
            draggable
            coordinate={simulatedLocation}
            zIndex={4000}
            onDragEnd={(e) => {
              if (onSimulatedLocationChange) {
                onSimulatedLocationChange(e.nativeEvent.coordinate);
              }
            }}
          >
            <View style={{ alignItems: 'center', transform: [{ scale: 1.5 }] }}>
              <View style={{ backgroundColor: '#3B82F6', padding: 12, borderRadius: 30, borderWidth: 3, borderColor: '#FFF', shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 10 }}>
                <Ionicons name="body" size={28} color="#FFF" />
              </View>
              <Text style={{ color: '#3B82F6', fontWeight: '900', fontSize: 14, backgroundColor: 'rgba(15,23,42,0.9)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 5, marginTop: 4, overflow: 'hidden' }}>TÚ (Simulador)</Text>
            </View>
          </Marker>
        )}

        {/* Marcador temporal seleccionado (para la creación de eventos) */}
        {selectedCoords && (
          <Marker
            coordinate={selectedCoords}
            title="Ubicación seleccionada"
            pinColor="green"
          />
        )}

        {/* Marcadores de los eventos (Dinámicos) */}
        {events.map((event) => {
          const config = getCategoryConfig(event.category);
          return (
            <Marker
              key={event.id}
              coordinate={{ latitude: event.latitude, longitude: event.longitude }}
              title={event.name}
              description={event.distance ? `A ${event.distance}` : event.category || 'Evento'}
              onPress={() => onSelectEvent(event)}
            >
              <View style={styles.teardropContainer}>
                <View style={[styles.teardrop, { backgroundColor: config.color }]} />
                <View style={styles.iconContainer}>
                  <FontAwesome5 name={config.icon as any} size={14} color="#FFF" />
                </View>
              </View>
            </Marker>
          );
        })}

        {/* Marcadores de Lugares Turísticos */}
        {touristSpots.map((spot) => (
          <Marker
            key={`spot-${spot.id}`}
            coordinate={{ latitude: spot.latitude, longitude: spot.longitude }}
            title={spot.name}
            description="Sitio Turístico"
            onPress={() => onSelectSpot && onSelectSpot(spot)}
          >
            <View style={styles.teardropContainer}>
              <View style={[styles.teardrop, { backgroundColor: '#FBBF24' }]} />
              <View style={styles.iconContainer}>
                <Ionicons name="camera" size={16} color="#0F172A" />
              </View>
            </View>
          </Marker>
        ))}

        {/* Marcadores de Transporte */}
        {transportStops.map((stop) => {
          const isRouteSelected = selectedRouteId === stop.route_id || selectedRouteId === stop.id;
          const isExactStop = selectedTransportStopId === stop.id;
          const stopOpacity = selectedRouteId ? (isRouteSelected ? 1 : 0.3) : 1;
          
          return (
            <Marker
              key={`stop-${stop.id}`}
              coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
              title={stop.name}
              description={isExactStop ? "¡Parada Seleccionada!" : "Parada de Transporte"}
              onPress={() => onSelectTransportStop && onSelectTransportStop(stop)}
              style={{ zIndex: isExactStop ? 3000 : 2500 }}
            >
              <View style={[styles.teardropContainer, { opacity: stopOpacity, transform: [{ scale: isExactStop ? 1.5 : 1.2 }] }]}>
                <View style={[styles.teardrop, { backgroundColor: isExactStop ? '#EF4444' : '#06B6D4' }]} />
                <View style={styles.iconContainer}>
                  <Ionicons name="bus" size={16} color="#FFF" />
                </View>
              </View>
            </Marker>
          );
        })}

        {/* Trazado y Simulación de Camiones (Tracking en vivo) */}
        {transportRoutes.map((route) => {
          if (!route.path_coordinates) return null;
          try {
            const coordsArray = JSON.parse(route.path_coordinates);
            if (coordsArray.length === 0) return null;
            
            // Loop de índice para simular el avance de la unidad
            const currentCoordIndex = busIndex % coordsArray.length;
            const currentCoord = coordsArray[currentCoordIndex];
            
            const isRouteSelected = selectedRouteId === route.id;
            const routeOpacity = selectedRouteId ? (isRouteSelected ? 1 : 0.2) : 0.8;
            const routeStrokeWidth = isRouteSelected ? 6 : 4;
            
            return (
              <React.Fragment key={`route-${route.id}`}>
                <Polyline 
                  coordinates={coordsArray} 
                  strokeColor={`rgba(52, 211, 153, ${routeOpacity})`} 
                  strokeWidth={routeStrokeWidth} 
                  lineDashPattern={isRouteSelected ? [] : [10, 5]} 
                />
                <Marker 
                  coordinate={currentCoord} 
                  title={`Unidad ${route.name}`}
                  description="En ruta activa..."
                  anchor={{ x: 0.5, y: 0.5 }}
                  onPress={() => onSelectTransportStop && onSelectTransportStop({ id: route.id, route_id: route.id, name: route.name, latitude: currentCoord.latitude, longitude: currentCoord.longitude } as any)}
                >
                  <View style={[styles.customPin, { backgroundColor: '#F59E0B', borderColor: '#FFF', borderWidth: 2, transform: [{ scale: isRouteSelected ? 1.4 : 1.2 }], opacity: routeOpacity }]}>
                    <Ionicons name="bus-outline" size={18} color="#FFF" />
                  </View>
                </Marker>
              </React.Fragment>
            );
          } catch (e) {
            return null;
          }
        })}
      </MapView>
    </View>
  );
});

export default MapComponent;

const styles = StyleSheet.create({
  container: { flex: 1, width: '100%', height: '100%' },
  map: { width: '100%', height: '100%' },
  customPin: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  pinTriangle: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 0,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    alignSelf: 'center',
    marginTop: -2,
  },
  teardropContainer: {
    width: 44,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teardrop: {
    width: 36,
    height: 36,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 0,
    transform: [{ rotate: '45deg' }],
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    top: 4,
  },
  iconContainer: {
    position: 'absolute',
    top: 13,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
