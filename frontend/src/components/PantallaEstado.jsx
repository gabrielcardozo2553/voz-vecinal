import { WifiOff, MapPinOff, Lock, Clock, Inbox, FilterX } from 'lucide-react';
import '../styles/components/PantallaEstado.css';

const TIPOS = {
  conexion: {
    Icono: WifiOff,
    tono: 'tono-naranja',
    titulo: 'No pudimos conectar',
    texto: 'Revisa tu conexión a internet. Si ya la revisaste, puede que el servidor esté fuera de servicio un rato.',
  },
  noEncontrada: {
    Icono: MapPinOff,
    tono: 'tono-celeste',
    titulo: 'Esta página no existe',
    texto: 'Puede que el enlace esté mal escrito o que la página ya no esté. Vuelve al inicio para seguir.',
  },
  sinAcceso: {
    Icono: Lock,
    tono: 'tono-amarillo',
    titulo: 'No tienes acceso a esta página',
    texto: 'Esta sección es solo para el personal de la municipalidad.',
  },
  sesion: {
    Icono: Clock,
    tono: 'tono-marron',
    titulo: 'Tu sesión venció',
    texto: 'Por seguridad cerramos la sesión después de unos días. Ingresa de nuevo y sigue donde estabas.',
  },
  vacio: {
    Icono: Inbox,
    tono: 'tono-verde',
    titulo: 'Todavía no hay reportes',
    texto: 'Cuando los vecinos reporten problemas, los verás aquí.',
    discontinuo: true,
  },
  sinResultados: {
    Icono: FilterX,
    tono: 'tono-celeste',
    titulo: 'Ningún reporte coincide',
    texto: 'Prueba con otra búsqueda o saca algún filtro para ver más resultados.',
    discontinuo: true,
  },
};

function PantallaEstado({ tipo, titulo, texto, children }) {
  const config = TIPOS[tipo] || TIPOS.noEncontrada;
  const { Icono } = config;
  const esAlerta = tipo === 'conexion';

  return (
    <div
      className={`pantalla-estado ${config.discontinuo ? 'pantalla-estado-discontinua' : ''}`}
      role={esAlerta ? 'alert' : undefined}
    >
      <span className={`pantalla-icono ${config.tono}`} aria-hidden="true">
        <Icono size={30} strokeWidth={1.8} />
      </span>
      <h2>{titulo || config.titulo}</h2>
      <p>{texto || config.texto}</p>
      {children && <div className="pantalla-acciones">{children}</div>}
    </div>
  );
}

export default PantallaEstado;
