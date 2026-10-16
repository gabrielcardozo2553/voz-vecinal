import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/pages/VerReportesPage.css';
import { iconoCategoria, colorCategoria, etiquetaCategoria } from '../utils/categorias';
import { MapPin, Calendar, Plus, X, RefreshCw } from 'lucide-react';
import { ESTADOS_TEXTO } from '../utils/estados';
import Spinner from '../components/Spinner';
import PantallaEstado from '../components/PantallaEstado';
import DetalleReporteModal from '../components/DetalleReporteModal';

function VerReportesPage() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);
  const [cantidadVisible, setCantidadVisible] = useState(6);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [filtroMes, setFiltroMes] = useState('todos');

  const cargarReportes = () => {
    setCargando(true);
    setError(false);
    axios.get('/api/reportes')
      .then(res => setReportes(res.data))
      .catch(err => {
        console.error(err);
        setError(true);
      })
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const [filtroEstado, setFiltroEstado] = useState('todos');

  const mesAnioTexto = (fecha) => {
    const texto = new Date(fecha).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  if (cargando) return <Spinner texto="Cargando reportes..." />;

  if (error) {
    return (
      <PantallaEstado tipo="conexion">
        <button type="button" className="pantalla-boton" onClick={cargarReportes}>
          <RefreshCw size={18} aria-hidden="true" />
          Reintentar
        </button>
      </PantallaEstado>
    );
  }

  const mesesDisponibles = [...new Set(reportes.map(r => mesAnioTexto(r.fecha_creacion)))];

  const reportesDelMes = filtroMes === 'todos'
    ? reportes
    : reportes.filter(r => mesAnioTexto(r.fecha_creacion) === filtroMes);

  const conteo = {
    todos: reportesDelMes.length,
    pendiente: reportesDelMes.filter(r => r.estado === 'pendiente').length,
    en_proceso: reportesDelMes.filter(r => r.estado === 'en_proceso').length,
    resuelto: reportesDelMes.filter(r => r.estado === 'resuelto').length,
  };

  const reportesFiltrados = filtroEstado === 'todos'
    ? reportesDelMes
    : reportesDelMes.filter(r => r.estado === filtroEstado);

  const reportesVisibles = reportesFiltrados.slice(0, cantidadVisible);
  const hayMasPorCargar = cantidadVisible < reportesFiltrados.length;

  return (
    <div className="ver-reportes-page">
      <div className="ver-reportes-cabecera">
        <h2>Reportes del pueblo</h2>
        <p className="ver-reportes-subtitulo">
          Mira los problemas que reportaron tus vecinos y cómo va su resolución.
        </p>
      </div>

      {reportes.length > 0 && (
        <div className="filtros-barra">
          <div className="filtro-estados" role="group" aria-label="Filtrar por estado">
            {[
              ['todos', 'Todos'],
              ['pendiente', 'Pendientes'],
              ['en_proceso', 'En proceso'],
              ['resuelto', 'Resueltos'],
            ].map(([valor, texto]) => (
              <button
                type="button"
                key={valor}
                className={`filtro-chip filtro-${valor} ${filtroEstado === valor ? 'activo' : ''}`}
                aria-pressed={filtroEstado === valor}
                onClick={() => {
                  setFiltroEstado(valor);
                  setCantidadVisible(6);
                }}
              >
                {texto}
                <span className="filtro-conteo">{conteo[valor]}</span>
              </button>
            ))}
          </div>
          <select
            className="filtro-mes"
            aria-label="Filtrar por mes"
            value={filtroMes}
            onChange={(e) => {
              setFiltroMes(e.target.value);
              setCantidadVisible(6);
            }}
          >
            <option value="todos">Todos los meses</option>
            {mesesDisponibles.map(mes => (
              <option key={mes} value={mes}>{mes}</option>
            ))}
          </select>
        </div>
      )}

      {reportesFiltrados.length === 0 ? (
        reportes.length === 0 ? (
          <PantallaEstado tipo="vacio" texto="Cuando los vecinos reporten problemas, los verás aquí. Puedes ser el primero.">
            <Link to="/" className="pantalla-boton">
              <Plus size={18} aria-hidden="true" />
              Hacer un reporte
            </Link>
          </PantallaEstado>
        ) : (
          <PantallaEstado tipo="sinResultados" texto="No hay reportes con ese filtro. Prueba con otro estado o mes.">
            <button
              type="button"
              className="pantalla-boton pantalla-boton-suave"
              onClick={() => { setFiltroEstado('todos'); setFiltroMes('todos'); }}
            >
              <X size={18} aria-hidden="true" />
              Quitar filtros
            </button>
          </PantallaEstado>
        )
      ) : (
        <>
          <div className="reportes-grid">
            {reportesVisibles.map(r => {
              const Icono = iconoCategoria(r.categoria);
              const color = colorCategoria(r.categoria);
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
                  </div>
                </div>
              );
            })}
          </div>

          {hayMasPorCargar && (
            <div className="cargar-mas-contenedor">
              <button
                type="button"
                className="boton-cargar-mas"
                onClick={() => setCantidadVisible(prev => prev + 6)}
              >
                Cargar más reportes
              </button>
            </div>
          )}
        </>
      )}

      <DetalleReporteModal
        reporte={reporteSeleccionado}
        onCerrar={() => setReporteSeleccionado(null)}
      />
    </div>
  );
}

export default VerReportesPage;