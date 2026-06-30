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

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)