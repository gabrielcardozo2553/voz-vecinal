import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/pages/MisReportesPage.css';
import { iconoCategoria, colorCategoria, etiquetaCategoria } from '../utils/categorias';
import { ESTADOS_TEXTO, ESTADOS_ORDEN } from '../utils/estados';
import { Inbox, MapPin, Calendar, Plus, RefreshCw, MessageCircle } from 'lucide-react';
import Spinner from '../components/Spinner';
import PantallaEstado from '../components/PantallaEstado';
import DetalleReporteModal from '../components/DetalleReporteModal';

function MisReportesPage() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  const cargarReportes = (silencioso = false) => {
    const token = localStorage.getItem('token');
    if (!silencioso) setCargando(true);
    setError(false);
    axios.get('/api/mis-reportes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => setReportes(res.data))
      .catch(err => {
        console.error(err);
        if (err.response?.status !== 401) setError(true);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  if (cargando) return <Spinner texto="Cargando tus reportes..." />;

  if (error) {
    return (
      <PantallaEstado tipo="conexion">
        <button type="button" className="pantalla-boton" onClick={() => cargarReportes()}>
          <RefreshCw size={18} aria-hidden="true" />
          Reintentar
        </button>
      </PantallaEstado>
    );
  }

  const resueltos = reportes.filter(r => r.estado === 'resuelto').length;
  const enCurso = reportes.length - resueltos;

  return (
    <div className="mis-reportes-page">
      <div className="mis-reportes-cabecera">
        <h2>Mis reportes</h2>
        <p className="mis-reportes-subtitulo">
          Estos son los problemas que reportaste vos. Tocá uno para ver el detalle completo.
        </p>
      </div>

      {reportes.length > 0 && (
        <div className="mis-reportes-resumen" aria-label="Resumen de tus reportes">
          <div className="resumen-dato">
            <span className="resumen-dato-numero">{reportes.length}</span>
            <span className="resumen-dato-texto">{reportes.length === 1 ? 'reporte' : 'reportes'}</span>
          </div>
          <div className="resumen-dato">
            <span className="resumen-dato-numero">{enCurso}</span>
            <span className="resumen-dato-texto">en curso</span>
          </div>
          <div className="resumen-dato resumen-dato-ok">
            <span className="resumen-dato-numero">{resueltos}</span>
            <span className="resumen-dato-texto">{resueltos === 1 ? 'resuelto' : 'resueltos'}</span>
          </div>
        </div>
      )}

      {reportes.length === 0 ? (
        <div className="estado-vacio estado-vacio-cta">
          <Inbox size={44} strokeWidth={1.5} aria-hidden="true" />
          <p>Todavía no hiciste ningún reporte.</p>
          <span>Cuando reportes un problema, va a aparecer acá y vas a poder seguir cómo avanza.</span>
          <Link to="/" className="boton-principal-link">
            <Plus size={20} aria-hidden="true" />
            Hacer mi primer reporte
          </Link>
        </div>
      ) : (
        <div className="reportes-grid">
          {reportes.map(r => {
            const Icono = iconoCategoria(r.categoria);
            const color = colorCategoria(r.categoria);
            const pasoActual = ESTADOS_ORDEN.indexOf(r.estado);
            return (
              <div
                key={r.id}
                className="reporte-card"
                role="button"
                tabIndex={0}
                onClick={() => setReporteSeleccionado(r)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setReporteSeleccionado(r);
                  }
                }}
              >
                <div className="reporte-media">
                  {r.foto_url ? (
                    <img src={r.foto_url} alt="Foto del reporte" className="reporte-foto" />
                  ) : (
                    <div className={`reporte-foto reporte-sin-foto ${color}`}>
                      <Icono size={40} strokeWidth={1.5} aria-hidden="true" />
                    </div>
                  )}
                  <span className={`estado-pill estado-${r.estado}`}>
                    <span className="estado-punto" />
                    {ESTADOS_TEXTO[r.estado]}
                  </span>
                </div>
                <div className="reporte-info">
                  <span className={`categoria-chip ${color}`}>
                    <Icono size={15} strokeWidth={2} aria-hidden="true" />
                    {etiquetaCategoria(r)}
                  </span>
                  <p className="reporte-descripcion">{r.descripcion}</p>
                  <p className="reporte-direccion">
                    <MapPin size={15} aria-hidden="true" />
                    {r.direccion}
                  </p>
                  <span className="reporte-fecha">
                    <Calendar size={14} aria-hidden="true" />
                    {new Date(r.fecha_creacion).toLocaleDateString('es-AR')}
                  </span>
                  {r.ultimo_mensaje_autor === 'admin' && (
                    <span className="aviso-consulta">
                      <MessageCircle size={14} aria-hidden="true" />
                      Te pidieron más información
                    </span>
                  )}
                  <div
                    className="mini-avance"
                    role="img"
                    aria-label={`Avance: ${ESTADOS_TEXTO[r.estado]}`}
                  >
                    {ESTADOS_ORDEN.map((estado, i) => (
                      <span
                        key={estado}
                        className={`mini-avance-tramo ${i <= pasoActual ? `lleno lleno-${r.estado}` : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <DetalleReporteModal
        reporte={reporteSeleccionado}
        onCerrar={() => setReporteSeleccionado(null)}
        esMio
        onMensajeEnviado={() => cargarReportes(true)}
      />
    </div>
  );
}

export default MisReportesPage;
