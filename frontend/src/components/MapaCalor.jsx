import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const CENTRO_LA_CRUZ = [-29.1667, -56.65];

function AjustarVista({ puntos }) {
  const map = useMap();

  useEffect(() => {
    if (puntos.length === 0) return;
    if (puntos.length === 1) {
      map.setView(puntos[0], 16);
      return;
    }
    map.fitBounds(puntos, { padding: [30, 30], maxZoom: 16 });
  }, [map, puntos]);

  return null;
}

function MapaCalor({ reportes }) {
  const conUbicacion = reportes.filter(r => r.latitud && r.longitud);
  const puntos = conUbicacion.map(r => [Number(r.latitud), Number(r.longitud)]);

  return (
    <MapContainer
      center={CENTRO_LA_CRUZ}
      zoom={14}
      scrollWheelZoom={false}
      className="mapa-calor"
      style={{ height: '260px', width: '100%' }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      {puntos.map((punto, i) => (
        <CircleMarker
          key={conUbicacion[i].id}
          center={punto}
          radius={16}
          pathOptions={{ color: '#c2410c', weight: 1, fillColor: '#c2410c', fillOpacity: 0.28 }}
        />
      ))}
      <AjustarVista puntos={puntos} />
    </MapContainer>
  );
}

export default MapaCalor;
