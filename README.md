# 🏙️ Urban Command (Event Map Chihuahua)

Urban Command es una aplicación híbrida de vanguardia desarrollada con **React Native (Expo)** y **Flask (Python)** que permite a los ciudadanos de Chihuahua descubrir sitios turísticos, eventos en tiempo real y trazar rutas de transporte público (como el Bowí y rutas alimentadoras) utilizando un radar espacial inteligente con notificaciones de proximidad.

## ✨ Características Principales
* **🗺️ Mapa Interactivo 2D/3D:** Visualización satelital y urbana con renderizado de marcadores personalizados de alta prioridad.
* **🚌 Transporte Inteligente:** Trazado de rutas de transporte público en tiempo real, cálculo de la parada más cercana basado en coordenadas geolocalizadas (GPS) y estimación de tiempo de llegada (ETA).
* **📍 Radar de Proximidad (Geofencing):** Sistema matemático de geocercas (Haversine Formula) que alerta al usuario cuando se encuentra físicamente cerca de un sitio turístico o un evento.
* **👾 Simulador GPS:** Una herramienta de testing integrada que permite "teletransportar" al usuario de manera manual en el mapa para probar alertas espaciales y notificaciones push sin necesidad de moverse físicamente.
* **🌐 Backend Robusto:** API REST en Python (Flask) conectada a una base de datos local SQLite con más de 40 estaciones y múltiples rutas pre-configuradas.

## 🚀 Tecnologías Utilizadas
* **Frontend:** React Native, Expo SDK, TypeScript, React Native Maps, Expo Location.
* **Backend:** Python, Flask, SQLite, Geopy.

## 📸 Pantallas
El sistema cuenta con una interfaz de diseño "Glassmorphism" con menús laterales colapsables, modo oscuro integrado (Tailwind Colors) y filtros en tiempo real.

## 🛠️ Instalación Local

1. Clona este repositorio:
```bash
git clone https://github.com/DanielFlores235/EventMapChihuahua.git
```
2. Instala las dependencias del frontend:
```bash
cd EventMapChihuahua
npm install
```
3. Levanta el entorno virtual y el backend de Python:
```bash
cd backend
python -m venv .venv
# Activa el entorno según tu sistema operativo (.venv/Scripts/activate en Windows)
pip install -r requirements.txt
python app.py
```
4. Levanta la aplicación móvil/web en otra terminal:
```bash
npx expo start
```
