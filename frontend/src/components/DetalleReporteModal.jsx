import { X } from 'lucide-react';
import MapaVista from './MapaVista';
import { iconoCategoria, colorCategoria } from '../utils/categorias';
import '../styles/components/DetalleReporteModal.css';

const estadoTexto = {
  pendiente: 'Pendiente',
  en_proceso: 'En proceso',
  resuelto: 'Resuelto'
};

function DetalleReporteModal({ reporte, onCerrar }) {
  if (!reporte) return null;

  const Icono = iconoCategoria(reporte.categoria);
  const color = colorCategoria(reporte.categoria);

  return (
    <div className="detalle-overlay" onClick={onCerrar}>
      <div className="detalle-contenido" onClick={(e) => e.stopPropagation()}>
        <button className="detalle-cerrar" onClick={onCerrar}>
          <X size={18} />
        </button>

        {reporte.foto_url && (
          <img
            src={reporte.foto_url}
            alt="Foto del reporte"
            className="detalle-foto"
          />
        )}

        <div className="detalle-info">
          <div className="detalle-header">
            <span className={`categoria-chip ${color}`}>
              <Icono size={15} strokeWidth={2} />
              {reporte.categoria}
            </span>
            <span className={`badge badge-${reporte.estado}`}>{estadoTexto[reporte.estado]}</span>
          </div>

          <p className="detalle-direccion">{reporte.direccion}</p>
          <p className="detalle-descripcion">{reporte.descripcion}</p>

          {reporte.latitud && reporte.longitud ? (
            <MapaVista latitud={reporte.latitud} longitud={reporte.longitud} />
          ) : (
            <p className="detalle-sin-mapa">Este reporte no tiene una ubicación marcada en el mapa.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetalleReporteModal;