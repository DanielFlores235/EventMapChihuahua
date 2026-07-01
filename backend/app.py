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

def get_db_connection():
    db_uri = os.getenv('DATABASE_URI', 'sqlite:///events.db')
    # Eliminar prefijo sqlite:/// si está presente para sqlite3 nativo
    if db_uri.startswith('sqlite:///'):
        db_path = db_uri.replace('sqlite:///', '')
    else:
        db_path = db_uri
    
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    # Crear la tabla de eventos con la estructura necesaria
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
    
<<<<<<< Updated upstream
=======
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

    # Migración automática si la tabla ya existía sin las nuevas columnas
    cursor.execute("PRAGMA table_info(events)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'start_time' not in columns:
        cursor.execute("ALTER TABLE events ADD COLUMN start_time TEXT")
    if 'end_time' not in columns:
        cursor.execute("ALTER TABLE events ADD COLUMN end_time TEXT")
    
>>>>>>> Stashed changes
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

    conn.close()

# Inicializar la base de datos al arrancar
init_db()

@app.route('/events', methods=['GET'])
def get_all_events():
    """Obtener todos los eventos registrados."""
    conn = get_db_connection()
    events = conn.execute('SELECT * FROM events ORDER BY date ASC').fetchall()
    conn.close()
    return jsonify([dict(e) for e in events])

@app.route('/events', methods=['POST'])
def create_event():
    """Registrar un nuevo evento. Integra geolocalización de OpenStreetMap."""
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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)