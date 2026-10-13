import { useEffect, useRef } from 'react';
import { X, MapPin, Calendar, Check, ExternalLink, Trash2, Clock } from 'lucide-react';
import MapaVista from './MapaVista';
import { iconoCategoria, colorCategoria } from '../utils/categorias';
import { ESTADOS_TEXTO, ESTADOS_ORDEN } from '../utils/estados';
import { prioridadDe, PRIORIDAD_TEXTO, textoDuracion } from '../utils/prioridad';
import '../styles/components/DetalleReporteModal.css';

const PASOS = [
  { estado: 'pendiente', texto: 'Recibido' },
  { estado: 'en_proceso', texto: 'En proceso' },
  { estado: 'resuelto', texto: 'Resuelto' },
];

function DetalleReporteModal({ reporte, onCerrar, admin = null }) {
  const botonCerrar = useRef(null);

  useEffect(() => {
    if (!reporte) return undefined;

    const alTeclear = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alTeclear);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    botonCerrar.current?.focus();

    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflowAnterior;
    };
  }, [reporte, onCerrar]);

  if (!reporte) return null;

  const Icono = iconoCategoria(reporte.categoria);
  const color = colorCategoria(reporte.categoria);
  const pasoActual = ESTADOS_ORDEN.indexOf(reporte.estado);
  const tieneMapa = reporte.latitud && reporte.longitud;
  const prioridad = admin ? prioridadDe(reporte) : null;
  const diasRespuesta = reporte.estado === 'resuelto' && reporte.fecha_resolucion
    ? (new Date(reporte.fecha_resolucion) - new Date(reporte.fecha_creacion)) / 86400000
    : null;
  const iniciales = admin
    ? `${(reporte.usuario_nombre || '?')[0]}${(reporte.usuario_apellido || '')[0] || ''}`.toUpperCase()
    : '';

  return (
    <div className="detalle-overlay" onClick={onCerrar}>
      <div
        className="detalle-contenido"
        role="dialog"
        aria-modal="true"
        aria-label="Detalle del reporte"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          ref={botonCerrar}
          className="detalle-cerrar"
          onClick={onCerrar}
          aria-label="Cerrar"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {reporte.foto_url ? (
          <img src={reporte.foto_url} alt="Foto del reporte" className="detalle-foto" />
        ) : (
          <div className={`detalle-foto detalle-sin-foto ${color}`}>
            <Icono size={56} strokeWidth={1.4} aria-hidden="true" />
          </div>
        )}

        <div className="detalle-info">
          <div className="detalle-header">
            <span className={`categoria-chip ${color}`}>
              <Icono size={15} strokeWidth={2} aria-hidden="true" />
              {reporte.categoria}
            </span>
            <div className="detalle-etiquetas">
              {prioridad && (
                <span className={`prioridad prioridad-${prioridad}`}>Prioridad {PRIORIDAD_TEXTO[prioridad].toLowerCase()}</span>
              )}
              <span className={`estado-pill estado-${reporte.estado}`}>
                <span className="estado-punto" />
                {ESTADOS_TEXTO[reporte.estado]}
              </span>
            </div>
          </div>

          <h3 className="detalle-titulo">{reporte.descripcion}</h3>

          <div className="detalle-datos">
            <p>
              <MapPin size={16} aria-hidden="true" />
              {reporte.direccion}
            </p>
            <p>
              <Calendar size={16} aria-hidden="true" />
              {new Date(reporte.fecha_creacion).toLocaleDateString('es-AR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>

          {admin && (
            <div className="detalle-admin">
              <div className="detalle-vecino">
                <span className="vecino-avatar" aria-hidden="true">{iniciales}</span>
                <div>
                  <p className="detalle-vecino-nombre">{reporte.usuario_nombre} {reporte.usuario_apellido}</p>
                  <p className="detalle-vecino-dni">DNI {reporte.usuario_dni}</p>
                </div>
              </div>

              <div className="detalle-gestion">
                <label htmlFor="detalle-estado">Estado del reporte</label>
                <select
                  id="detalle-estado"
                  value={reporte.estado}
                  onChange={(e) => admin.onCambiarEstado(reporte.id, e.target.value)}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_proceso">En proceso</option>
                  <option value="resuelto">Resuelto</option>
                </select>
                {diasRespuesta !== null && diasRespuesta >= 0 && (
                  <p className="detalle-respuesta">
                    <Clock size={15} aria-hidden="true" />
                    Se resolvió en {textoDuracion(diasRespuesta)}
                  </p>
                )}
              </div>
            </div>
          )}

          <ol className="detalle-progreso" aria-label="Avance del reporte">
            {PASOS.map((paso, i) => {
              const hecho = i < pasoActual;
              const actual = i === pasoActual;
              return (
                <li
                  key={paso.estado}
                  className={`progreso-paso ${hecho ? 'hecho' : ''} ${actual ? 'actual' : ''}`}
                  aria-current={actual ? 'step' : undefined}
                >
                  <span className="progreso-circulo">
                    {hecho || (actual && paso.estado === 'resuelto')
                      ? <Check size={14} strokeWidth={3} aria-hidden="true" />
                      : i + 1}
                  </span>
                  <span className="progreso-texto">{paso.texto}</span>
                </li>
              );
            })}
          </ol>

          <div className="detalle-mapa-bloque">
            <h4>Ubicación</h4>
            {tieneMapa ? (
              <>
                <MapaVista latitud={reporte.latitud} longitud={reporte.longitud} />
                <a
                  className="detalle-enlace-mapa"
                  href={`https://www.openstreetmap.org/?mlat=${reporte.latitud}&mlon=${reporte.longitud}#map=18/${reporte.latitud}/${reporte.longitud}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir en un mapa más grande
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </>
            ) : (
              <p className="detalle-sin-mapa">Este reporte no tiene una ubicación marcada en el mapa.</p>
            )}
          </div>

          {admin && (
            <button type="button" className="detalle-eliminar" onClick={() => admin.onEliminar(reporte)}>
              <Trash2 size={18} aria-hidden="true" />
              Eliminar este reporte
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default DetalleReporteModal;
