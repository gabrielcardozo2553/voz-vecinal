import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pinReporte = L.divIcon({
  className: 'pin-reporte',
  html: '<svg width="36" height="46" viewBox="0 0 36 46" aria-hidden="true"><path d="M18 2C9.7 2 3 8.5 3 16.6 3 27.5 18 44 18 44s15-16.5 15-27.4C33 8.5 26.3 2 18 2z" fill="#c2410c" stroke="#ffffff" stroke-width="2.5"/><circle cx="18" cy="16.5" r="6" fill="#ffffff"/></svg>',
  iconSize: [36, 46],
  iconAnchor: [18, 44],
});

function MapaVista({ latitud, longitud }) {
  return (
    <MapContainer
      center={[latitud, longitud]}
      zoom={16}
      scrollWheelZoom={false}
      style={{ height: '200px', width: '100%', borderRadius: '16px', border: '1px solid #d9d6cb' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <Marker position={[latitud, longitud]} icon={pinReporte} />
    </MapContainer>
  );
}

export default MapaVista;
