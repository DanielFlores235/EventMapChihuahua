import os
import sqlite3
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from geopy.distance import geodesic
from geopy.geocoders import Nominatim

# Cargar variables del .env
load_dotenv()

app = Flask(__name__)
CORS(app)  # Permite comunicación sin problemas de CORS

# Configuración de Nominatim para OpenStreetMap
# Es necesario un User-Agent descriptivo para cumplir con las políticas de uso de OSM
geolocator = Nominatim(user_agent="eventmap_chihuahua_app")

# ==============================================================================
# MOTOR DE BASE DE DATOS
# ==============================================================================
# Esta función es como la "llave" maestra. Cada vez que necesitamos guardar o 
# leer algo de la memoria (SQLite), mandamos llamar esta función para que nos abra la puerta.
def get_db_connection():
    db_uri = os.getenv('DATABASE_URI', 'sqlite:///events.db')
    
    # SQLite nativo no requiere el prefijo "sqlite:///", así que lo limpiamos por si acaso
    if db_uri.startswith('sqlite:///'):
        db_path = db_uri.replace('sqlite:///', '')
    else:
        db_path = db_uri
    
    # Abrimos la conexión al archivo events.db
    conn = sqlite3.connect(db_path)
    # Configuramos para que las filas parezcan diccionarios de Python (más fáciles de leer)
    conn.row_factory = sqlite3.Row
    return conn

# ==============================================================================
# INICIALIZACIÓN Y SEMILLA (SEEDING)
# ==============================================================================
# Cuando arranca el servidor, esta función revisa si las tablas existen. 
# Si el proyecto es nuevo, crea los "cajones" de memoria (Eventos, Transporte, Sitios).
# Además, inyecta datos reales para que no empiece vacío.
def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Tabla de Eventos: Guarda ferias, conciertos, etc.
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            date TEXT NOT NULL,
            category TEXT,
            address TEXT
        )
    ''')
    
    # Crear la tabla de centros turísticos
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tourist_spots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            description TEXT,
            start_time TEXT,
            end_time TEXT
        )
    ''')

    # Crear la tabla de rutas de transporte
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transport_routes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            origin TEXT NOT NULL,
            destination TEXT NOT NULL
        )
    ''')

    # Migración de tabla transport_routes para soportar horarios y frecuencias
    cursor.execute("PRAGMA table_info(transport_routes)")
    columns_routes = [row[1] for row in cursor.fetchall()]
    if 'path_coordinates' not in columns_routes:
        cursor.execute("ALTER TABLE transport_routes ADD COLUMN path_coordinates TEXT")
    if 'start_time' not in columns_routes:
        cursor.execute("ALTER TABLE transport_routes ADD COLUMN start_time TEXT")
    if 'end_time' not in columns_routes:
        cursor.execute("ALTER TABLE transport_routes ADD COLUMN end_time TEXT")
    if 'frequency_mins' not in columns_routes:
        cursor.execute("ALTER TABLE transport_routes ADD COLUMN frequency_mins INTEGER")

    # Crear la tabla de paradas de transporte
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transport_stops (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            route_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            order_index INTEGER NOT NULL,
            FOREIGN KEY (route_id) REFERENCES transport_routes (id) ON DELETE CASCADE
        )
    ''')

    # Migración automática si la tabla ya existía sin las nuevas columnas
    cursor.execute("PRAGMA table_info(events)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'start_time' not in columns:
        cursor.execute("ALTER TABLE events ADD COLUMN start_time TEXT")
    if 'end_time' not in columns:
        cursor.execute("ALTER TABLE events ADD COLUMN end_time TEXT")
    # Comprobar si hay registros. Si no los hay, sembramos datos iniciales.
    cursor.execute('SELECT COUNT(*) FROM events')
    if cursor.fetchone()[0] == 0:
        default_events = [
            ("Concierto Rock Centro", 28.6353, -106.0889, "2026-07-10", "Música", "Plaza del Ángel, Centro, Chihuahua"),
            ("Feria del Hueso Panteones", 28.6200, -106.0700, "2026-11-02", "Cultura", "San Jorge, Chihuahua"),
            ("Expo Chihuahua Tecnología", 28.6401, -106.0750, "2026-08-15", "Tecnología", "Expo Chihuahua, Chihuahua"),
            ("Taller de Pintura Quinta Carolina", 28.6750, -106.0950, "2026-07-22", "Cultura", "Quinta Carolina, Chihuahua"),
            ("Festival Gastronómico", 28.6310, -106.0720, "2026-09-05", "Cultura", "Parque El Palomar, Chihuahua")
        ]
        cursor.executemany('''
            INSERT INTO events (name, latitude, longitude, date, category, address)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', default_events)
        conn.commit()

    # Comprobar si hay centros turísticos. Si no los hay, sembramos datos iniciales.
    cursor.execute('SELECT COUNT(*) FROM tourist_spots')
    if cursor.fetchone()[0] == 0:
        default_spots = [
            ("Catedral Metropolitana", 28.6353, -106.0760, "Iglesia histórica y principal atractivo turístico en la plaza de armas.", "08:00", "20:00"),
            ("Quinta Gameros", 28.6300, -106.0750, "Mansión porfiriana convertida en museo. Arquitectura impresionante.", "10:00", "18:00"),
            ("Museo Pancho Villa", 28.6315, -106.0730, "Antigua casa del Centauro del Norte, hoy un museo clave de la Revolución.", "09:00", "17:00"),
            ("Grutas de Nombre de Dios", 28.6750, -106.0500, "Cuevas milenarias subterráneas con estalactitas y estalagmitas.", "10:00", "16:00"),
            ("Presa El Rejón", 28.6100, -106.1200, "Parque recreativo con lago, tirolesa, lanchas y pistas para correr.", "06:00", "22:00"),
            ("Palacio de Gobierno", 28.6360, -106.0755, "Sede del poder ejecutivo estatal, con murales sobre la historia de Chihuahua y el altar a Hidalgo.", "09:00", "18:00"),
            ("Casa Chihuahua Centro de Patrimonio Cultural", 28.6365, -106.0745, "Museo interactivo en el antiguo edificio de correos, famoso por el calabozo de Hidalgo.", "10:00", "17:00"),
            ("Museo de la Lealtad Republicana", 28.6345, -106.0780, "También conocido como Casa Juárez, fue sede del gobierno de Benito Juárez.", "09:00", "18:00"),
            ("Estación del Chepe", 28.6250, -106.0820, "Punto de partida del famoso tren El Chepe hacia las Barrancas del Cobre.", "05:00", "21:00"),
            ("Parque Acueducto", 28.6150, -106.0950, "Extenso parque lineal con los restos históricos del acueducto virreinal.", "00:00", "23:59")
        ]
        cursor.executemany('''
            INSERT INTO tourist_spots (name, latitude, longitude, description, start_time, end_time)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', default_spots)
        conn.commit()

    # Comprobar si hay rutas de transporte. Si no las hay, sembramos datos de prueba.
    import json
    
    # 🚍 RUTA TRONCAL BOWÍ (Ruta Principal de la Ciudad)
    # Trazamos el circuito completo del camión de norte a sur
    bowi_path = json.dumps([
        {"latitude": 28.6850, "longitude": -106.1100},
        {"latitude": 28.6650, "longitude": -106.1000},
        {"latitude": 28.6500, "longitude": -106.0950},
        {"latitude": 28.6400, "longitude": -106.0900},
        {"latitude": 28.6370, "longitude": -106.0800},
        {"latitude": 28.6353, "longitude": -106.0760},
        {"latitude": 28.6200, "longitude": -106.0650},
        {"latitude": 28.6000, "longitude": -106.0500}
    ])

    cursor.execute('SELECT COUNT(*) FROM transport_routes')
    if cursor.fetchone()[0] == 0:
        # Insertamos el Bowí con un horario de 6 AM a 10 PM, pasando cada 15 minutos.
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Ruta Troncal Bowí', 'Terminal Norte', 'Terminal Sur', ?, '06:00', '22:00', 15)", (bowi_path,))
        bowi_id = cursor.lastrowid
        
        # Sembramos las 12 Estaciones Reales más importantes del Bowí
        default_stops = [
            (bowi_id, "Terminal Norte", 28.6850, -106.1100, 1),
            (bowi_id, "Estación Juan Escutia", 28.6750, -106.1050, 2),
            (bowi_id, "Estación Zaragoza", 28.6650, -106.1000, 3),
            (bowi_id, "Estación Universidad (UACH)", 28.6500, -106.0950, 4),
            (bowi_id, "Estación Panamericana", 28.6400, -106.0900, 5),
            (bowi_id, "Estación Deza y Ulloa", 28.6385, -106.0850, 6),
            (bowi_id, "Estación Justicia", 28.6370, -106.0800, 7),
            (bowi_id, "Estación Niños Héroes / Centro", 28.6353, -106.0760, 8),
            (bowi_id, "Estación Ocampo", 28.6300, -106.0700, 9),
            (bowi_id, "Estación Ochoa", 28.6200, -106.0650, 10),
            (bowi_id, "Estación Nueva España", 28.6100, -106.0580, 11),
            (bowi_id, "Terminal Sur", 28.6000, -106.0500, 12)
        ]
        cursor.executemany('''
            INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index)
            VALUES (?, ?, ?, ?, ?)
        ''', default_stops)

        # 🚍 Ruta 2: Circunvalación 2 (Horario de 5:30 AM a 9:00 PM, pasa cada 20 mins)
        circ2_path = json.dumps([
            {"latitude": 28.6650, "longitude": -106.1250}, # Juventud Norte
            {"latitude": 28.6450, "longitude": -106.1150}, # Juventud Centro
            {"latitude": 28.6350, "longitude": -106.0950}, # Zarco
            {"latitude": 28.6150, "longitude": -106.0600}  # Deportiva
        ])
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Circunvalación 2', 'Norte', 'Deportiva', ?, '05:30', '21:00', 20)", (circ2_path,))
        circ2_id = cursor.lastrowid
        circ2_stops = [
            (circ2_id, "Campus UACH Norte", 28.6650, -106.1250, 1),
            (circ2_id, "Periférico de la Juventud", 28.6450, -106.1150, 2),
            (circ2_id, "Zarco y Américas", 28.6350, -106.0950, 3),
            (circ2_id, "Deportiva Sur", 28.6150, -106.0600, 4)
        ]
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', circ2_stops)

        # 🚍 Ruta 3: Tarahumara (Horario de 6 AM a 10 PM, pasa cada 18 mins)
        tara_path = json.dumps([
            {"latitude": 28.6800, "longitude": -106.1100},
            {"latitude": 28.6700, "longitude": -106.1150},
            {"latitude": 28.6500, "longitude": -106.1100}
        ])
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Tarahumara', 'Norte', 'Centro', ?, '06:00', '22:00', 18)", (tara_path,))
        tara_id = cursor.lastrowid
        tara_stops = [
            (tara_id, "Complejo Industrial Pistolas", 28.6800, -106.1100, 1),
            (tara_id, "Vialidad Los Nogales", 28.6700, -106.1150, 2),
            (tara_id, "Industrias", 28.6500, -106.1100, 3)
        ]
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', tara_stops)

        # 🚍 Ruta 4: Circunvalación 1 (Horario de 6 AM a 9:30 PM, pasa cada 25 mins)
        circ1_path = json.dumps([
            {"latitude": 28.6353, "longitude": -106.0760},
            {"latitude": 28.6253, "longitude": -106.0860},
            {"latitude": 28.6153, "longitude": -106.0760},
            {"latitude": 28.6053, "longitude": -106.0660}
        ])
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Circunvalación 1', 'Centro', 'Sur', ?, '06:00', '21:30', 25)", (circ1_path,))
        circ1_id = cursor.lastrowid
        circ1_stops = [
            (circ1_id, "Catedral de Chihuahua", 28.6353, -106.0760, 1),
            (circ1_id, "Avenida Pacheco Centro", 28.6253, -106.0860, 2),
            (circ1_id, "Pacheco Sur", 28.6153, -106.0760, 3),
            (circ1_id, "Comandancia Sur", 28.6053, -106.0660, 4)
        ]
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', circ1_stops)

        # 🚍 Ruta 5: Panamericana (Horario de 5:00 AM a 10:30 PM, pasa cada 12 mins)
        pana_path = json.dumps([
            {"latitude": 28.6350, "longitude": -106.0800},
            {"latitude": 28.6400, "longitude": -106.0900},
            {"latitude": 28.6500, "longitude": -106.1000},
            {"latitude": 28.6650, "longitude": -106.1050}
        ])
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Panamericana', 'Centro', 'Norte', ?, '05:00', '22:30', 12)", (pana_path,))
        pana_id = cursor.lastrowid
        pana_stops = [
            (pana_id, "Centro (Niños Héroes)", 28.6350, -106.0800, 1),
            (pana_id, "Tecnológico (Tec 1)", 28.6400, -106.0900, 2),
            (pana_id, "Américas Plaza", 28.6500, -106.1000, 3),
            (pana_id, "Zaragoza Norte", 28.6650, -106.1050, 4)
        ]
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', pana_stops)
        
        # 🚍 Ruta 6: Dale-UP (Horario de 6:00 AM a 10:00 PM, pasa cada 15 mins)
        daleup_path = json.dumps([
            {"latitude": 28.6353, "longitude": -106.0760},
            {"latitude": 28.6300, "longitude": -106.0600},
            {"latitude": 28.6250, "longitude": -106.0500},
            {"latitude": 28.6280, "longitude": -106.0100},
            {"latitude": 28.6350, "longitude": -106.0000}
        ])
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Dale-UP', 'Centro', 'Romanzza', ?, '06:00', '22:00', 15)", (daleup_path,))
        daleup_id = cursor.lastrowid
        daleup_stops = [
            (daleup_id, "Centro (Calle 11)", 28.6353, -106.0760, 1),
            (daleup_id, "20 de Noviembre", 28.6300, -106.0600, 2),
            (daleup_id, "Fuentes Mares / Pacheco", 28.6250, -106.0500, 3),
            (daleup_id, "Paseo de los Leones", 28.6280, -106.0100, 4),
            (daleup_id, "Fraccionamiento Romanzza", 28.6350, -106.0000, 5)
        ]
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', daleup_stops)

        # 🚍 Ruta 7: Kennedy (Horario de 6:00 AM a 10:24 PM, pasa cada 20 mins)
        kennedy_path = json.dumps([
            {"latitude": 28.6000, "longitude": -106.0500},
            {"latitude": 28.6100, "longitude": -106.0550},
            {"latitude": 28.6200, "longitude": -106.0600},
            {"latitude": 28.6300, "longitude": -106.0700},
            {"latitude": 28.6353, "longitude": -106.0760}
        ])
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Kennedy', 'Terminal Sur', 'Centro', ?, '06:00', '22:24', 20)", (kennedy_path,))
        kennedy_id = cursor.lastrowid
        kennedy_stops = [
            (kennedy_id, "Terminal Sur (Vivebus)", 28.6000, -106.0500, 1),
            (kennedy_id, "Blvd Fuentes Mares Sur", 28.6100, -106.0550, 2),
            (kennedy_id, "Colonia Kennedy", 28.6200, -106.0600, 3),
            (kennedy_id, "Ocampo", 28.6300, -106.0700, 4),
            (kennedy_id, "Centro / Aldama", 28.6353, -106.0760, 5)
        ]
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', kennedy_stops)

        # 🚍 Ruta 8: Jardines de Oriente (Horario de 5:30 AM a 10:00 PM, pasa cada 16 mins)
        jardines_path = json.dumps([
            {"latitude": 28.6000, "longitude": -106.0500},
            {"latitude": 28.6050, "longitude": -106.0300},
            {"latitude": 28.5900, "longitude": -106.0100},
            {"latitude": 28.5800, "longitude": -106.0000},
            {"latitude": 28.5750, "longitude": -105.9900}
        ])
        cursor.execute("INSERT INTO transport_routes (name, origin, destination, path_coordinates, start_time, end_time, frequency_mins) VALUES ('Jardines de Oriente', 'Terminal Sur', 'Equus', ?, '05:30', '22:00', 16)", (jardines_path,))
        jardines_id = cursor.lastrowid
        jardines_stops = [
            (jardines_id, "Terminal Sur", 28.6000, -106.0500, 1),
            (jardines_id, "Vialidad CH-P", 28.6050, -106.0300, 2),
            (jardines_id, "Juan Pablo II", 28.5900, -106.0100, 3),
            (jardines_id, "Avenida Equus", 28.5800, -106.0000, 4),
            (jardines_id, "Fracc. Jardines de Oriente", 28.5750, -105.9900, 5)
        ]
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', jardines_stops)
        
        conn.commit()
    else:
        # Aseguramos que el path se guarde en instalaciones anteriores
        cursor.execute("UPDATE transport_routes SET path_coordinates = ? WHERE name = 'Ruta Troncal Bowí' AND path_coordinates IS NULL", (bowi_path,))
        conn.commit()

    conn.close()

# Inicializar# ==============================================================================
# API REST: GESTIÓN DE EVENTOS (CRUD)
# ==============================================================================

@app.route('/events', methods=['GET'])
def get_all_events():
    """
    [LEER] Obtiene absolutamente todos los eventos registrados en la ciudad.
    Los ordena por fecha (los más próximos primero).
    """
    conn = get_db_connection()
    events = conn.execute('SELECT * FROM events ORDER BY date ASC').fetchall()
    conn.close()
    return jsonify([dict(ix) for ix in events]), 200

@app.route('/events', methods=['POST'])
def create_event():
    """
    [CREAR] Guarda un nuevo evento en la base de datos.
    Si el usuario no proporciona coordenadas (lat/lon), el sistema intentará
    traducir la dirección escrita a coordenadas GPS reales usando Nominatim.
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos inválidos o faltantes"}), 400

    name = data.get('name')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    date = data.get('date')
    category = data.get('category')
    address = data.get('address')

    if not name or not date:
        return jsonify({"error": "El nombre del evento y la fecha son obligatorios"}), 400

    # Si no se proveen coordenadas pero se provee dirección, usamos geocodificación de OSM
    if (latitude is None or longitude is None) and address:
        try:
            # Buscamos la dirección en Chihuahua para evitar falsos positivos
            search_query = f"{address}, Chihuahua, Mexico"
            location = geolocator.geocode(search_query)
            if location:
                latitude = location.latitude
                longitude = location.longitude
                # Guardamos la dirección oficial devuelta por OSM
                address = location.address
            else:
                return jsonify({"error": f"No se encontraron coordenadas para la dirección: {address}"}), 404
        except Exception as e:
            return jsonify({"error": f"Error de comunicación con OpenStreetMap: {str(e)}"}), 500

    if latitude is None or longitude is None:
        return jsonify({"error": "Debe proveer coordenadas (lat, lng) o una dirección válida"}), 400

    # Si se proveen coordenadas pero no dirección, realizamos geocodificación inversa
    if not address:
        try:
            location = geolocator.reverse((latitude, longitude))
            if location:
                address = location.address
            else:
                address = f"Coordenadas: {latitude}, {longitude}"
        except Exception:
            address = f"Coordenadas: {latitude}, {longitude}"

    # Guardar en SQLite
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO events (name, latitude, longitude, date, category, address)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (name, latitude, longitude, date, category, address))
    conn.commit()
    event_id = cursor.lastrowid
    conn.close()

    new_event = {
        "id": event_id,
        "name": name,
        "latitude": latitude,
        "longitude": longitude,
        "date": date,
        "category": category,
        "address": address
    }
    return jsonify(new_event), 201

@app.route('/events/nearby', methods=['GET'])
def get_nearby_events():
    """Obtener eventos dentro de un radio de 10 km."""
    user_lat = request.args.get('lat', type=float)
    user_lng = request.args.get('lng', type=float)

    if user_lat is None or user_lng is None:
        return jsonify({"error": "Faltan las coordenadas 'lat' o 'lng' del usuario"}), 400

    user_coords = (user_lat, user_lng)
    
    conn = get_db_connection()
    events = conn.execute('SELECT * FROM events').fetchall()
    conn.close()

    nearby_events = []
    for event in events:
        event_dict = dict(event)
        event_coords = (event_dict['latitude'], event_dict['longitude'])
        
        # Calcular distancia geodésica exacta en kilómetros
        distance_km = geodesic(user_coords, event_coords).kilometers
        
        # Filtrar si está a 10 km o menos
        if distance_km <= 10:
            event_dict['distance'] = f"{distance_km:.2f} km"
            nearby_events.append(event_dict)

    return jsonify(nearby_events)

@app.route('/events/category/<category>', methods=['GET'])
def get_events_by_category(category):
    """Obtener eventos filtrados por categoría (Puntos Extra)."""
    conn = get_db_connection()
    events = conn.execute(
        'SELECT * FROM events WHERE LOWER(category) = ? ORDER BY date ASC',
        (category.lower(),)
    ).fetchall()
    conn.close()
    return jsonify([dict(e) for e in events])

@app.route('/geocode', methods=['GET'])
def geocode_address():
    """Geocodificación directa usando OpenStreetMap."""
    address = request.args.get('address')
    if not address:
        return jsonify({"error": "Se requiere el parámetro 'address'"}), 400
    try:
        search_query = f"{address}, Chihuahua, Mexico"
        location = geolocator.geocode(search_query)
        if location:
            return jsonify({
                "latitude": location.latitude,
                "longitude": location.longitude,
                "address": location.address
            })
        return jsonify({"error": "Dirección no encontrada"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/reverse', methods=['GET'])
def reverse_geocode():
    """Geocodificación inversa usando OpenStreetMap."""
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    if lat is None or lng is None:
        return jsonify({"error": "Se requieren los parámetros 'lat' y 'lng'"}), 400
    try:
        location = geolocator.reverse((lat, lng))
        if location:
            return jsonify({
                "address": location.address
            })
        return jsonify({"error": "Coordenadas no encontradas en el mapa"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/spots', methods=['GET'])
def get_all_spots():
    """Obtener todos los centros turísticos registrados."""
    conn = get_db_connection()
    spots = conn.execute('SELECT * FROM tourist_spots ORDER BY name ASC').fetchall()
    conn.close()
    return jsonify([dict(s) for s in spots])

@app.route('/spots', methods=['POST'])
def create_spot():
    """Registrar un nuevo centro turístico."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos inválidos o faltantes"}), 400

    name = data.get('name')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    description = data.get('description')
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if not name or latitude is None or longitude is None:
        return jsonify({"error": "Nombre, latitud y longitud son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO tourist_spots (name, latitude, longitude, description, start_time, end_time)
        VALUES (?, ?, ?, ?, ?, ?)
    ''', (name, latitude, longitude, description, start_time, end_time))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    new_spot = {
        "id": new_id,
        "name": name,
        "latitude": latitude,
        "longitude": longitude,
        "description": description,
        "start_time": start_time,
        "end_time": end_time
    }
    return jsonify(new_spot), 201

@app.route('/spots/<int:spot_id>', methods=['PUT'])
def update_spot(spot_id):
    """Actualizar un centro turístico existente."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "Datos inválidos o faltantes"}), 400

    name = data.get('name')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    description = data.get('description')
    start_time = data.get('start_time')
    end_time = data.get('end_time')

    if not name or latitude is None or longitude is None:
        return jsonify({"error": "Nombre, latitud y longitud son obligatorios"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tourist_spots WHERE id = ?', (spot_id,))
    spot = cursor.fetchone()
    if not spot:
        conn.close()
        return jsonify({"error": "Lugar turístico no encontrado"}), 404

    cursor.execute('''
        UPDATE tourist_spots
        SET name = ?, latitude = ?, longitude = ?, description = ?, start_time = ?, end_time = ?
        WHERE id = ?
    ''', (name, latitude, longitude, description, start_time, end_time, spot_id))
    conn.commit()
    conn.close()

    updated_spot = {
        "id": spot_id,
        "name": name,
        "latitude": latitude,
        "longitude": longitude,
        "description": description,
        "start_time": start_time,
        "end_time": end_time
    }
    return jsonify(updated_spot), 200

@app.route('/spots/<int:spot_id>', methods=['DELETE'])
def delete_spot(spot_id):
    """Eliminar un centro turístico existente."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tourist_spots WHERE id = ?', (spot_id,))
    spot = cursor.fetchone()
    if not spot:
        conn.close()
        return jsonify({"error": "Lugar turístico no encontrado"}), 404

    cursor.execute('DELETE FROM tourist_spots WHERE id = ?', (spot_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Lugar turístico eliminado correctamente"}), 200

# ==========================================
# RUTAS DE TRANSPORTE
# ==========================================
@app.route('/transport/routes', methods=['GET'])
def get_all_routes():
    conn = get_db_connection()
    routes = conn.execute('SELECT * FROM transport_routes').fetchall()
    conn.close()
    return jsonify([dict(r) for r in routes])

# ==============================================================================
# API REST: MOTOR DE TRANSPORTE Y RUTEO MASIVO
# ==============================================================================

@app.route('/transport/routes', methods=['POST'])
def create_route():
    """
    [CREAR] Alta Masiva de Rutas. 
    Recibe el nombre del camión y un MEGA arreglo (JSON) con TODAS sus paradas.
    Guarda la ruta principal e inmediatamente (Transacción Masiva) inserta cada una
    de las paradas en la tabla hija para que aparezcan en el mapa al instante.
    """
    data = request.get_json()
    name = data.get('name')
    origin = data.get('origin')
    destination = data.get('destination')
    stops = data.get('stops', []) # Recibe el arreglo de múltiples paradas
    
    if not name or not origin or not destination:
        return jsonify({"error": "Nombre, origen y destino son requeridos"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Insertar la ruta (El Camión)
    # Por defecto, todas las nuevas rutas operan de 06:00 a 22:00 cada 30 mins,
    # el usuario podría modificarlo después.
    start_time = data.get('start_time', '06:00')
    end_time = data.get('end_time', '22:00')
    frequency = data.get('frequency_mins', 30)

    cursor.execute('INSERT INTO transport_routes (name, origin, destination, start_time, end_time, frequency_mins) VALUES (?, ?, ?, ?, ?, ?)', (name, origin, destination, start_time, end_time, frequency))
    new_id = cursor.lastrowid
    
    # 2. Insertar las múltiples paradas de una vez (Ruteo Masivo)
    if stops:
        stops_tuples = []
        for index, stop in enumerate(stops):
            stops_tuples.append((new_id, stop.get('name', f'Parada {index+1}'), stop.get('latitude'), stop.get('longitude'), index+1))
        
        cursor.executemany('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', stops_tuples)
        
    conn.commit()
    conn.close()
    return jsonify({"id": new_id, "name": name, "origin": origin, "destination": destination, "stops_count": len(stops)}), 201

@app.route('/transport/routes/<int:route_id>', methods=['PUT'])
def update_route(route_id):
    data = request.get_json()
    name = data.get('name')
    origin = data.get('origin')
    destination = data.get('destination')
    
    if not name or not origin or not destination:
        return jsonify({"error": "Nombre, origen y destino son requeridos"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE transport_routes SET name = ?, origin = ?, destination = ? WHERE id = ?', (name, origin, destination, route_id))
    conn.commit()
    conn.close()
    return jsonify({"id": route_id, "name": name, "origin": origin, "destination": destination}), 200

@app.route('/transport/routes/<int:route_id>', methods=['DELETE'])
def delete_route(route_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM transport_stops WHERE route_id = ?', (route_id,))
    cursor.execute('DELETE FROM transport_routes WHERE id = ?', (route_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Ruta y sus paradas eliminadas correctamente"}), 200

# ==========================================
# PARADAS DE TRANSPORTE
# ==========================================
@app.route('/transport/stops', methods=['GET'])
def get_stops():
    route_id = request.args.get('route_id')
    conn = get_db_connection()
    if route_id:
        stops = conn.execute('SELECT * FROM transport_stops WHERE route_id = ? ORDER BY order_index ASC', (route_id,)).fetchall()
    else:
        stops = conn.execute('SELECT * FROM transport_stops ORDER BY route_id, order_index ASC').fetchall()
    conn.close()
    return jsonify([dict(s) for s in stops])

@app.route('/transport/stops', methods=['POST'])
def create_stop():
    data = request.get_json()
    route_id = data.get('route_id')
    name = data.get('name')
    lat = data.get('latitude')
    lng = data.get('longitude')
    order_index = data.get('order_index', 0)
    
    if not route_id or not name or lat is None or lng is None:
        return jsonify({"error": "Parámetros incompletos para crear la parada"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('INSERT INTO transport_stops (route_id, name, latitude, longitude, order_index) VALUES (?, ?, ?, ?, ?)', 
                   (route_id, name, lat, lng, order_index))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return jsonify({"id": new_id, "route_id": route_id, "name": name, "latitude": lat, "longitude": lng, "order_index": order_index}), 201

@app.route('/transport/stops/<int:stop_id>', methods=['PUT'])
def update_stop(stop_id):
    data = request.get_json()
    name = data.get('name')
    lat = data.get('latitude')
    lng = data.get('longitude')
    order_index = data.get('order_index', 0)
    
    if not name or lat is None or lng is None:
        return jsonify({"error": "Parámetros incompletos"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('UPDATE transport_stops SET name = ?, latitude = ?, longitude = ?, order_index = ? WHERE id = ?', 
                   (name, lat, lng, order_index, stop_id))
    conn.commit()
    conn.close()
    return jsonify({"id": stop_id, "name": name, "latitude": lat, "longitude": lng, "order_index": order_index}), 200

@app.route('/transport/stops/<int:stop_id>', methods=['DELETE'])
def delete_stop(stop_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM transport_stops WHERE id = ?', (stop_id,))
    conn.commit()
    conn.close()
    return jsonify({"message": "Parada eliminada correctamente"}), 200

# ==========================================
# CALCULO DE TRANSPORTE CERCANO
# ==========================================
@app.route('/transport/nearest', methods=['GET'])
def get_nearest_transport():
    """Calcula la parada más cercana basada en la ubicación del usuario y su destino."""
    try:
        user_lat = float(request.args.get('user_lat'))
        user_lng = float(request.args.get('user_lng'))
        dest_lat = float(request.args.get('dest_lat'))
        dest_lng = float(request.args.get('dest_lng'))
    except (TypeError, ValueError):
        return jsonify({"error": "Parámetros de coordenadas inválidos o faltantes"}), 400

    conn = get_db_connection()
    stops = conn.execute('''
        SELECT s.*, r.name as route_name 
        FROM transport_stops s
        JOIN transport_routes r ON s.route_id = r.id
    ''').fetchall()
    conn.close()

    if not stops:
        return jsonify({"error": "No hay paradas registradas en el sistema"}), 404

    user_coords = (user_lat, user_lng)
    dest_coords = (dest_lat, dest_lng)
    
    # 1. Encontrar paradas cercanas al destino (radio 1.5km)
    dest_stops = []
    for s in stops:
        s_coords = (s['latitude'], s['longitude'])
        dist_to_dest = geodesic(dest_coords, s_coords).meters
        if dist_to_dest <= 1500:
            dest_stops.append(s)

    if not dest_stops:
        return jsonify({"error": "Ninguna ruta de transporte público actual llega cerca de su destino."}), 404

    # 2. De esas rutas posibles, encontrar la parada que el usuario tiene más cerca
    valid_route_ids = set([s['route_id'] for s in dest_stops])
    
    best_stop = None
    min_dist = float('inf')
    
    for s in stops:
        if s['route_id'] in valid_route_ids:
            s_coords = (s['latitude'], s['longitude'])
            dist_to_user = geodesic(user_coords, s_coords).meters
            if dist_to_user < min_dist:
                min_dist = dist_to_user
                best_stop = dict(s)
                
    if not best_stop:
        return jsonify({"error": "No se encontró ruta viable"}), 404

    # Tiempo estimado caminando hacia la parada: ~80 metros por minuto (4.8 km/h)
    walking_time_mins = max(1, int(min_dist / 80))
    
    best_stop['distance_meters'] = int(min_dist)
    best_stop['walking_time_mins'] = walking_time_mins
    
    return jsonify(best_stop), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)