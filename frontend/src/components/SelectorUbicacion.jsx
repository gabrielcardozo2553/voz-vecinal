import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Arreglo necesario: por defecto, Leaflet no encuentra bien las imágenes
// del marcador cuando se usa con Vite/React, así que se las indicamos a mano.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Coordenadas de La Cruz, Corrientes (centro por defecto del mapa)
const CENTRO_LA_CRUZ = [-29.1761, -56.6427];

function ManejadorClicks({ onSeleccionar }) {
  useMapEvents({
    click(e) {
      onSeleccionar(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function SelectorUbicacion({ latitud, longitud, onSeleccionar }) {
  return (
    <MapContainer
      center={latitud && longitud ? [latitud, longitud] : CENTRO_LA_CRUZ}
      zoom={14}
      style={{ height: '220px', width: '100%', borderRadius: '10px' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <ManejadorClicks onSeleccionar={onSeleccionar} />
      {latitud && longitud && <Marker position={[latitud, longitud]} />}
    </MapContainer>
  );
}

export default SelectorUbicacion;