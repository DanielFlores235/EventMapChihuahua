import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput,
  ScrollView,
  Alert,
  Modal
} from 'react-native';
import MapComponent from '../components/MapComponent';
import MapView, { Marker } from 'react-native-maps';
import { useEvents } from '../hooks/useEvents';
import { useSpots } from '../hooks/useSpots';
import { useTransport } from '../hooks/useTransport';
import { Ionicons } from '@expo/vector-icons';
import { geocodeAddress } from '../api/events';
import * as Location from 'expo-location';

// ==============================================================================
// MOTOR ESPACIAL: FÓRMULA DE HAVERSINE
// ==============================================================================
// Esta fórmula matemática calcula la distancia exacta en metros entre dos puntos
// tomando en cuenta la curvatura de la Tierra. Se usa para las geocercas y el radar.
const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // Radio de la Tierra en metros
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(dp/2) * Math.sin(dp/2) +
            Math.cos(p1) * Math.cos(p2) *
            Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Devuelve la distancia total en metros
};

export default function MapScreen({ navigation }: any) {
  const { events, loadAllEvents } = useEvents();
  const { spots, loadSpots } = useSpots();
  const { stops, routes, loadStops, loadRoutes, calculateNearestRoute } = useTransport();

  const [searchQuery, setSearchQuery] = useState('');
  
  const [mapRegion, setMapRegion] = useState({
    latitude: 28.6353,
    longitude: -106.0889,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [userCoords, setUserCoords] = useState<{latitude: number; longitude: number} | null>(null);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [itemType, setItemType] = useState<'event' | 'spot' | 'transport' | null>(null);
  const [nearestStopData, setNearestStopData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'map' | 'events' | 'spots' | 'saved' | 'transport'>('map');
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);
  const [selectedTransportStopId, setSelectedTransportStopId] = useState<number | null>(null);
  const [proximityAlert, setProximityAlert] = useState<{title: string, message: string, item: any, type: string} | null>(null);
  
  // MODO SIMULACIÓN: Permite arrastrar la ubicación del usuario para probar alertas
  const [isSimulating, setIsSimulating] = useState(false);

  const mapRef = useRef<MapView>(null);

  // Ref para no repetir notificaciones del mismo elemento
  const notifiedIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadAllEvents();
    loadSpots();
    loadRoutes();
    loadStops(); // Cargar TODAS las paradas de la ciudad por defecto
    startTracking();
  }, []);

  // ==============================================================================
  // GESTOR DE GPS (TRACKING EN TIEMPO REAL)
  // ==============================================================================
  // Activa el GPS del dispositivo y comienza a escuchar cambios de ubicación.
  // Cada 5 segundos actualizará el radar.
  const startTracking = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Urban Command necesita GPS para lanzar alertas espaciales.');
      return;
    }

    await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 5000,
        distanceInterval: 10,
      },
      (location) => {
        // Solo actualizamos si no estamos en modo simulación
        if (!isSimulating) {
          const coords = { latitude: location.coords.latitude, longitude: location.coords.longitude };
          setUserCoords(coords);
          checkProximityAlerts(coords);
        }
      }
    );
  };

  // ==============================================================================
  // RADAR DE GEOCERCAS (PROXIMITY ALERTS)
  // ==============================================================================
  // Compara tu ubicación contra todos los eventos, lugares turísticos y paradas de la ciudad.
  // Si algo rompe la barrera de los 200 metros, dispara el pop-up luminoso flotante.
  const checkProximityAlerts = (coords: {latitude: number, longitude: number}) => {
    
    // 1. Escanear Eventos Cercanos
    events.forEach(ev => {
      const dist = getDistance(coords.latitude, coords.longitude, ev.latitude, ev.longitude);
      if (dist < 200 && !notifiedIds.current.has(`ev-${ev.id}`)) {
        notifiedIds.current.add(`ev-${ev.id}`);
        setProximityAlert({ title: 'ALERTA DE EVENTO', message: `Estás a ${Math.round(dist)}m del evento: ${ev.name}`, item: ev, type: 'event' });
      }
    });

    // 2. Escanear Sitios Turísticos Cercanos
    spots.forEach(sp => {
      const dist = getDistance(coords.latitude, coords.longitude, sp.latitude, sp.longitude);
      if (dist < 200 && !notifiedIds.current.has(`sp-${sp.id}`)) {
        notifiedIds.current.add(`sp-${sp.id}`);
        setProximityAlert({ title: 'ZONA TURÍSTICA', message: `Estás a ${Math.round(dist)}m de: ${sp.name}`, item: sp, type: 'spot' });
      }
    });

    // 3. Escanear Paradas de Transporte Cercanas
    stops.forEach(st => {
      const dist = getDistance(coords.latitude, coords.longitude, st.latitude, st.longitude);
      if (dist < 200 && !notifiedIds.current.has(`st-${st.id}`)) {
        notifiedIds.current.add(`st-${st.id}`);
        setProximityAlert({ title: 'PARADA CERCANA', message: `Estás a ${Math.round(dist)}m de la parada de camión: ${st.name}`, item: st, type: 'transport' });
      }
    });
  };

  // ==============================================================================
  // MOTOR DE CÁLCULO DE TIEMPO (ETA)
  // Calcula matemáticamente cuántos minutos faltan para el próximo camión
  // basado en la hora actual del reloj local y la frecuencia de la ruta.
  // ==============================================================================
  const calculateETA = (route: TransportRoute) => {
    if (!route.start_time || !route.end_time || !route.frequency_mins) return "Frecuencia desconocida";
    
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    
    const [startH, startM] = route.start_time.split(':').map(Number);
    const [endH, endM] = route.end_time.split(':').map(Number);
    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;
    
    if (currentMins < startTotal || currentMins > endTotal) {
      return "Fuera de servicio en este momento";
    }
    
    const minsSinceStart = currentMins - startTotal;
    const minsSinceLastBus = minsSinceStart % route.frequency_mins;
    const minsUntilNextBus = route.frequency_mins - minsSinceLastBus;
    
    if (minsUntilNextBus === 0) return "¡Llegando ahora!";
    return `Próxima unidad en aprox. ${minsUntilNextBus} min`;
  };

  const handleSearch = async () => {
    if (!searchQuery) return;
    try {
      const result = await geocodeAddress(searchQuery);
      setMapRegion({
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      });
      setSelectedItem({
        name: "Ubicación Buscada",
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude
      });
      setItemType('spot');
      setActiveTab('map');
      
      // Animación de cámara
      mapRef.current?.animateToRegion({
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      }, 1000);
    } catch (e) {
      Alert.alert('Búsqueda fallida', 'No se encontró la dirección.');
    }
  };

  const findNearestTransport = async () => {
    if (!selectedItem || !userCoords) {
      Alert.alert('Atención', 'Selecciona un destino y asegúrate de tener señal GPS.');
      return;
    }
    const result = await calculateNearestRoute(
      userCoords.latitude, userCoords.longitude, 
      selectedItem.latitude, selectedItem.longitude
    );
    
    if (result) {
      setNearestStopData(result);
      
      // Animar la cámara hacia la parada encontrada para contexto visual
      mapRef.current?.animateToRegion({
        latitude: result.latitude,
        longitude: result.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      }, 1500);

      Alert.alert('Ruta Óptima', `Aborda el ${result.route_name} en la parada "${result.name}". Tiempo a pie: ${result.walking_time_mins} min.`);
    } else {
      Alert.alert('Sin rutas', 'No hay rutas de transporte cercanas a su destino.');
    }
  };

  // ZOOM CONTROLS
  const handleZoomIn = () => {
    const newReg = { ...mapRegion, latitudeDelta: mapRegion.latitudeDelta / 2, longitudeDelta: mapRegion.longitudeDelta / 2 };
    setMapRegion(newReg);
    mapRef.current?.animateToRegion(newReg, 500);
  };
  const handleZoomOut = () => {
    const newReg = { ...mapRegion, latitudeDelta: mapRegion.latitudeDelta * 2, longitudeDelta: mapRegion.longitudeDelta * 2 };
    setMapRegion(newReg);
    mapRef.current?.animateToRegion(newReg, 500);
  };
  const handleLocate = () => {
    if (userCoords) {
      const newReg = { latitude: userCoords.latitude, longitude: userCoords.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 };
      setMapRegion(newReg);
      mapRef.current?.animateToRegion(newReg, 1000);
    } else {
      Alert.alert('Buscando Satélites', 'Espera unos segundos mientras conectamos con tu antena GPS.');
    }
  };

  const renderActiveList = () => {
    let data: any[] = [];
    if (activeTab === 'events') data = events;
    if (activeTab === 'spots') data = spots;
    if (activeTab === 'transport') data = stops;

    if (activeTab !== 'map' && data.length > 0) {
      return (
        <ScrollView style={styles.listContainer}>
          <Text style={styles.listTitle}>DIRECTORIO: {activeTab.toUpperCase()}</Text>
          {data.map((item, idx) => (
            <TouchableOpacity 
              key={idx} 
              style={styles.listItem}
              onPress={() => {
                setMapRegion({ latitude: item.latitude, longitude: item.longitude, latitudeDelta: 0.01, longitudeDelta: 0.01 });
                setSelectedItem(item);
                
                if (activeTab === 'events') {
                  setItemType('event');
                  setSelectedRouteId(null);
                } else if (activeTab === 'spots') {
                  setItemType('spot');
                  setSelectedRouteId(null);
                  setSelectedTransportStopId(null);
                } else {
                  setItemType('transport');
                  setSelectedRouteId(item.route_id || item.id);
                  setSelectedTransportStopId(item.id);
                }
                
                setActiveTab('map');
              }}
            >
              <Text style={styles.listItemName}>{item.name}</Text>
              <Text style={styles.listItemDesc}>{activeTab === 'transport' ? 'Parada de Transporte' : (item.description || item.address)}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {/* POPUP DE PROXIMIDAD (GEOCERCA) */}
      {proximityAlert && (
        <Modal transparent={true} animationType="fade" visible={!!proximityAlert}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Ionicons name="notifications" size={24} color="#34D399" />
                <Text style={styles.modalTitle}>{proximityAlert.title}</Text>
              </View>
              <Text style={styles.modalMessage}>{proximityAlert.message}</Text>
              
              <View style={styles.modalActions}>
                <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setProximityAlert(null)}>
                  <Text style={styles.modalBtnTextCancel}>Ignorar</Text>
                </TouchableOpacity>
                
                {(proximityAlert.type === 'event' || proximityAlert.type === 'spot') && (
                  <TouchableOpacity style={styles.modalBtnAction} onPress={() => {
                    const item = proximityAlert.item;
                    const type = proximityAlert.type;
                    setProximityAlert(null);
                    if (type === 'event') {
                      navigation.navigate('EventDetail', { event: item });
                    } else {
                      navigation.navigate('SpotDetail', { spot: item }); // Lo crearemos en la fase 3
                    }
                  }}>
                    <Text style={styles.modalBtnTextAction}>Cómo Llegar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* MAPA DE FONDO */}
      <View style={styles.mapArea}>
        <MapComponent
          ref={mapRef}
          initialRegion={mapRegion}
          userLocation={userCoords}
          simulatedLocation={isSimulating ? (userCoords || { latitude: mapRegion.latitude, longitude: mapRegion.longitude }) : null}
          onSimulatedLocationChange={(newCoords) => {
            setUserCoords(newCoords);
            checkProximityAlerts(newCoords);
          }}
          events={events}
          touristSpots={spots}
          transportStops={stops}
          transportRoutes={routes}
          selectedRouteId={selectedRouteId}
          selectedTransportStopId={selectedTransportStopId}
          onSelectEvent={(ev) => { setSelectedItem(ev); setItemType('event'); setNearestStopData(null); setActiveTab('map'); setSelectedRouteId(null); setSelectedTransportStopId(null); }}
          onSelectSpot={(sp) => { setSelectedItem(sp); setItemType('spot'); setNearestStopData(null); setActiveTab('map'); setSelectedRouteId(null); setSelectedTransportStopId(null); }}
          onSelectTransportStop={(ts) => { setSelectedItem(ts); setItemType('transport'); setNearestStopData(null); setActiveTab('map'); setSelectedRouteId(ts.route_id || ts.id); setSelectedTransportStopId(ts.id); }}
          onMapPress={(c) => {
            navigation.navigate('CreateEvent', { latitude: c.latitude, longitude: c.longitude });
          }}
        />
      </View>

      {/* TOP NAVIGATION BAR */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <Text style={styles.topTitle}>URBAN COMMAND</Text>
          <View style={styles.topLinks}>
            <Text style={[styles.topLink, styles.topLinkActive]}>EXPLORAR</Text>
            <Text style={styles.topLink}>ANÁLISIS</Text>
            <Text style={styles.topLink}>REPORTES</Text>
          </View>
        </View>
        <View style={styles.topBarRight}>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={16} color="#94A3B8" />
            <TextInput 
              style={styles.searchInput} 
              placeholder="Buscar ubicación..." 
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
            />
          </View>
          <Ionicons name="notifications-outline" size={20} color="#F8FAFC" style={styles.headerIcon} />
          <Ionicons name="settings-outline" size={20} color="#F8FAFC" style={styles.headerIcon} />
        </View>
      </View>

      {/* LEFT SIDEBAR */}
      <View style={styles.sidebar}>
        <View style={styles.sidebarHeader}>
          <Ionicons name="business" size={28} color="#34D399" />
          <View style={{ marginLeft: 10 }}>
            <Text style={styles.sidebarTitle}>CHIHUAHUA</Text>
            <Text style={styles.sidebarSubtitle}>LENS</Text>
            <Text style={styles.sidebarTagline}>PRECISIÓN URBANA</Text>
          </View>
        </View>

        <View style={styles.sidebarMenu}>
          <TouchableOpacity style={[styles.menuItem, activeTab === 'map' && styles.menuItemActive]} onPress={() => setActiveTab('map')}>
            <Ionicons name="map-outline" size={18} color={activeTab === 'map' ? "#F8FAFC" : "#94A3B8"} />
            <Text style={activeTab === 'map' ? styles.menuItemTextActive : styles.menuItemText}>MAP EXPLORER</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, activeTab === 'events' && styles.menuItemActive]} onPress={() => setActiveTab('events')}>
            <Ionicons name="calendar-outline" size={18} color={activeTab === 'events' ? "#F8FAFC" : "#94A3B8"} />
            <Text style={activeTab === 'events' ? styles.menuItemTextActive : styles.menuItemText}>CITY EVENTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, activeTab === 'spots' && styles.menuItemActive]} onPress={() => setActiveTab('spots')}>
            <Ionicons name="camera-outline" size={18} color={activeTab === 'spots' ? "#F8FAFC" : "#94A3B8"} />
            <Text style={activeTab === 'spots' ? styles.menuItemTextActive : styles.menuItemText}>TOURIST SPOTS</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, activeTab === 'transport' && styles.menuItemActive]} onPress={() => setActiveTab('transport')}>
            <Ionicons name="bus-outline" size={18} color={activeTab === 'transport' ? "#F8FAFC" : "#94A3B8"} />
            <Text style={activeTab === 'transport' ? styles.menuItemTextActive : styles.menuItemText}>PUBLIC TRANSPORT</Text>
          </TouchableOpacity>

          <View style={{ marginTop: 30, paddingHorizontal: 20 }}>
            <Text style={{ color: '#64748B', fontSize: 10, fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 }}>ADMINISTRACIÓN</Text>
            <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('CreateEvent', {})}>
              <Ionicons name="add-circle-outline" size={16} color="#34D399" />
              <Text style={styles.adminBtnText}>Gestión Eventos / Sitios</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.adminBtn} onPress={() => navigation.navigate('CreateTransport', {})}>
              <Ionicons name="bus-outline" size={16} color="#3B82F6" />
              <Text style={styles.adminBtnText}>Gestión de Rutas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sidebarFooter}>
          <TouchableOpacity style={styles.analyticsButton}>
            <Text style={styles.analyticsButtonText}>VIEW ANALYTICS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* RIGHT PANEL - DETALLES O LISTADOS */}
      {activeTab === 'map' && selectedItem ? (
        <View style={styles.rightPanel}>
          <View style={styles.infoCard}>
            <Text style={styles.cardCategory}>CATEGORÍA: {itemType === 'event' ? selectedItem.category?.toUpperCase() : itemType === 'transport' ? 'TRANSPORTE' : 'TURISMO'}</Text>
            <Text style={styles.cardTitle}>{selectedItem.name}</Text>
            
            {itemType === 'transport' && selectedRouteId ? (
              <View style={{ marginBottom: 15 }}>
                <Text style={{ color: '#CBD5E1', fontSize: 13, marginBottom: 5 }}>
                  <Ionicons name="bus" /> Camiones que pasan por aquí:
                </Text>
                {routes.find(r => r.id === selectedRouteId) && (
                  <View style={{ backgroundColor: '#1E293B', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155' }}>
                    <Text style={{ color: '#F8FAFC', fontSize: 14, fontWeight: 'bold', marginBottom: 6 }}>
                      🚌 Unidad: {routes.find(r => r.id === selectedRouteId)?.name}
                    </Text>
                    <Text style={{ color: '#34D399', fontSize: 12, fontWeight: 'bold', marginBottom: 6 }}>📍 Sube en: {selectedItem.name}</Text>
                    
                    <View style={{ backgroundColor: '#0F172A', padding: 8, borderRadius: 6, marginBottom: 6, flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="time" size={16} color="#3B82F6" style={{ marginRight: 6 }} />
                      <Text style={{ color: '#60A5FA', fontSize: 12, fontWeight: 'bold' }}>
                        ETA: {calculateETA(routes.find(r => r.id === selectedRouteId)!)}
                      </Text>
                    </View>

                    <Text style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                      Horario: {routes.find(r => r.id === selectedRouteId)?.start_time} - {routes.find(r => r.id === selectedRouteId)?.end_time}
                    </Text>
                    <Text style={{ color: '#94A3B8', fontSize: 12 }}>
                      Ruta: {routes.find(r => r.id === selectedRouteId)?.origin} ➔ {routes.find(r => r.id === selectedRouteId)?.destination}
                    </Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.cardDesc}>
                {selectedItem.description || selectedItem.address || 'Punto de interés geolocalizado en la red urbana.'}
              </Text>
            )}

            <View style={styles.cardActions}>
              <TouchableOpacity style={[styles.primaryActionBtn, { flex: itemType === 'event' ? 0.5 : 1 }]} onPress={findNearestTransport}>
                <Text style={styles.primaryActionText}>PARADA CERCANA</Text>
              </TouchableOpacity>
              {itemType === 'event' && (
                <TouchableOpacity style={[styles.secondaryActionBtn, { flex: 0.5, marginLeft: 10 }]} onPress={() => navigation.navigate('EventDetail', { event: selectedItem })}>
                  <Text style={styles.secondaryActionText}>DETALLES</Text>
                </TouchableOpacity>
              )}
            </View>

            {nearestStopData && (
              <View style={styles.alertBox}>
                <Text style={styles.alertTitle}><Ionicons name="walk" size={14} /> RUTA SUGERIDA</Text>
                <Text style={styles.alertText}>
                  Camina {nearestStopData.walking_time_mins} min hacia la parada {nearestStopData.name} ({nearestStopData.route_name}).
                </Text>
              </View>
            )}
          </View>
          
        </View>
      ) : renderActiveList()}

      {/* FLOATING ACTION BAR (Always Visible) */}
      <View style={styles.floatingActionBar}>
        <View style={styles.weatherBox}>
          <Text style={styles.weatherLabel}><Ionicons name="thermometer-outline" /> TEMP.</Text>
          <Text style={styles.weatherVal}>24°C</Text>
        </View>
        <TouchableOpacity 
          style={[styles.weatherBox, { backgroundColor: isSimulating ? '#3B82F6' : '#1E293B', marginLeft: 10 }]} 
          onPress={() => {
            if (!isSimulating && !userCoords) {
              setUserCoords({ latitude: mapRegion.latitude, longitude: mapRegion.longitude });
            }
            setIsSimulating(!isSimulating);
          }}
        >
          <Text style={[styles.weatherLabel, { color: isSimulating ? '#FFF' : '#64748B' }]}><Ionicons name="body" /> SIMULAR GPS</Text>
          <Text style={[styles.weatherVal, { fontSize: 10, color: isSimulating ? '#FFF' : '#F8FAFC' }]}>{isSimulating ? 'ACTIVO' : 'INACTIVO'}</Text>
        </TouchableOpacity>
      </View>

      {/* BOTTOM COORDS */}
      <View style={styles.bottomCoordsBox}>
        <View style={styles.coordItem}>
          <Text style={styles.coordLabel}>LATITUD (GPS)</Text>
          <Text style={styles.coordVal}>{userCoords ? userCoords.latitude.toFixed(4) : mapRegion.latitude.toFixed(4)}° N</Text>
        </View>
        <View style={styles.coordItem}>
          <Text style={styles.coordLabel}>LONGITUD (GPS)</Text>
          <Text style={styles.coordVal}>{userCoords ? Math.abs(userCoords.longitude).toFixed(4) : Math.abs(mapRegion.longitude).toFixed(4)}° W</Text>
        </View>
      </View>
      
      {/* ZOOM CONTROLS */}
      <View style={styles.zoomControls}>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomIn}><Text style={styles.zoomText}>+</Text></TouchableOpacity>
        <TouchableOpacity style={styles.zoomBtn} onPress={handleZoomOut}><Text style={styles.zoomText}>-</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.zoomBtn, { marginTop: 10 }]} onPress={handleLocate}><Ionicons name="locate" size={16} color="#F8FAFC" /></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050B14' },
  mapArea: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 },
  topBar: { height: 60, backgroundColor: '#0F172A', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1E293B', zIndex: 10 },
  topBarLeft: { flexDirection: 'row', alignItems: 'center' },
  topTitle: { color: '#F8FAFC', fontSize: 20, fontWeight: '900', letterSpacing: 1, marginRight: 30 },
  topLinks: { flexDirection: 'row' },
  topLink: { color: '#94A3B8', fontSize: 13, fontWeight: '600', marginRight: 20, letterSpacing: 1 },
  topLinkActive: { color: '#F8FAFC', borderBottomWidth: 2, borderBottomColor: '#34D399', paddingBottom: 5 },
  topBarRight: { flexDirection: 'row', alignItems: 'center' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingHorizontal: 12, borderRadius: 6, height: 36, marginRight: 15, width: 250 },
  searchInput: { flex: 1, color: '#F8FAFC', marginLeft: 8, fontSize: 13 },
  headerIcon: { marginLeft: 15 },
  sidebar: { position: 'absolute', top: 60, left: 0, bottom: 0, width: 260, backgroundColor: '#0B1120', borderRightWidth: 1, borderRightColor: '#1E293B', zIndex: 5, paddingTop: 30 },
  sidebarHeader: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 40 },
  sidebarTitle: { color: '#F8FAFC', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  sidebarSubtitle: { color: '#34D399', fontSize: 18, fontWeight: '300', letterSpacing: 2 },
  sidebarTagline: { color: '#64748B', fontSize: 10, letterSpacing: 1, marginTop: 4 },
  sidebarMenu: { flex: 1 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, paddingHorizontal: 25 },
  menuItemActive: { backgroundColor: '#1E293B', borderLeftWidth: 3, borderLeftColor: '#34D399' },
  menuItemText: { color: '#94A3B8', fontSize: 13, fontWeight: '600', letterSpacing: 1, marginLeft: 15 },
  menuItemTextActive: { color: '#F8FAFC', fontSize: 13, fontWeight: 'bold', letterSpacing: 1, marginLeft: 15 },
  sidebarFooter: { padding: 20, paddingBottom: 40 },
  analyticsButton: { borderWidth: 1, borderColor: '#34D399', paddingVertical: 12, alignItems: 'center', borderRadius: 4 },
  analyticsButtonText: { color: '#34D399', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  rightPanel: { position: 'absolute', top: 80, right: 20, width: 340, zIndex: 10 },
  infoCard: { backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 25, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10, marginBottom: 15 },
  cardCategory: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold', letterSpacing: 2, marginBottom: 8 },
  cardTitle: { color: '#F8FAFC', fontSize: 22, fontWeight: '900', marginBottom: 15, textTransform: 'uppercase' },
  cardDesc: { color: '#CBD5E1', fontSize: 13, lineHeight: 20, marginBottom: 20 },
  cardActions: { flexDirection: 'row', justifyContent: 'space-between' },
  primaryActionBtn: { backgroundColor: '#34D399', flex: 0.55, paddingVertical: 12, alignItems: 'center', borderRadius: 4 },
  primaryActionText: { color: '#0F172A', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  secondaryActionBtn: { backgroundColor: '#1E293B', flex: 0.4, paddingVertical: 12, alignItems: 'center', borderRadius: 4, borderWidth: 1, borderColor: '#334155' },
  secondaryActionText: { color: '#CBD5E1', fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
  alertBox: { marginTop: 15, padding: 10, backgroundColor: '#064E3B', borderRadius: 4, borderWidth: 1, borderColor: '#059669' },
  alertTitle: { color: '#34D399', fontSize: 11, fontWeight: 'bold', marginBottom: 5 },
  alertText: { color: '#A7F3D0', fontSize: 12 },
  floatingActionBar: { position: 'absolute', bottom: 80, right: 20, flexDirection: 'row', justifyContent: 'flex-end', zIndex: 10 },
  weatherBox: { backgroundColor: '#1E293B', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#334155', minWidth: 100, alignItems: 'center' },
  weatherLabel: { color: '#64748B', fontSize: 10, fontWeight: 'bold', letterSpacing: 1, marginBottom: 8 },
  weatherVal: { color: '#F8FAFC', fontSize: 20, fontWeight: '300' },
  bottomCoordsBox: { position: 'absolute', bottom: 20, left: 280, backgroundColor: 'rgba(15, 23, 42, 0.9)', flexDirection: 'row', padding: 12, borderRadius: 4, borderWidth: 1, borderColor: '#1E293B', zIndex: 10 },
  coordItem: { marginRight: 20 },
  coordLabel: { color: '#64748B', fontSize: 9, fontWeight: 'bold', letterSpacing: 1, marginBottom: 2 },
  coordVal: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold' },
  zoomControls: { position: 'absolute', bottom: 20, right: 20, zIndex: 10 },
  zoomBtn: { backgroundColor: '#0F172A', width: 36, height: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 5, borderWidth: 1, borderColor: '#1E293B', borderRadius: 4 },
  zoomText: { color: '#F8FAFC', fontSize: 20, fontWeight: 'bold' },
  listContainer: { position: 'absolute', top: 80, right: 20, width: 340, maxHeight: 500, backgroundColor: 'rgba(15, 23, 42, 0.95)', padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B', zIndex: 10 },
  listTitle: { color: '#34D399', fontSize: 14, fontWeight: 'bold', marginBottom: 15, letterSpacing: 2 },
  listItem: { paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  listItemName: { color: '#F8FAFC', fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  listItemDesc: { color: '#94A3B8', fontSize: 12 },
  adminBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E293B', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 4, marginBottom: 8, borderWidth: 1, borderColor: '#334155', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5 },
  adminBtnText: { color: '#F8FAFC', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-start', alignItems: 'center', paddingTop: 60 },
  modalContent: { backgroundColor: '#1E293B', width: '90%', borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#34D399', shadowColor: '#34D399', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  modalTitle: { color: '#34D399', fontSize: 16, fontWeight: 'bold', marginLeft: 10, letterSpacing: 1 },
  modalMessage: { color: '#F8FAFC', fontSize: 14, marginBottom: 20 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  modalBtnCancel: { padding: 10 },
  modalBtnTextCancel: { color: '#94A3B8', fontWeight: 'bold' },
  modalBtnAction: { backgroundColor: '#34D399', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8 },
  modalBtnTextAction: { color: '#0F172A', fontWeight: 'bold' }
});
