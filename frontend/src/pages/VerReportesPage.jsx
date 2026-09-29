import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/pages/VerReportesPage.css';
import { iconoCategoria, colorCategoria } from '../utils/categorias';
import { Inbox } from 'lucide-react';
import Spinner from '../components/Spinner';
import DetalleReporteModal from '../components/DetalleReporteModal';

function VerReportesPage() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cantidadVisible, setCantidadVisible] = useState(6);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);
  const [filtroMes, setFiltroMes] = useState('todos');

  useEffect(() => {
    axios.get('http://localhost:3000/api/reportes')
      .then(res => setReportes(res.data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  const estadoTexto = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    resuelto: 'Resuelto'
  };

  const mesAnioTexto = (fecha) => {
    const texto = new Date(fecha).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
  };

  if (cargando) return <Spinner texto="Cargando reportes..." />;

  const mesesDisponibles = [...new Set(reportes.map(r => mesAnioTexto(r.fecha_creacion)))];

  const reportesFiltrados = filtroMes === 'todos'
    ? reportes
    : reportes.filter(r => mesAnioTexto(r.fecha_creacion) === filtroMes);

  const reportesVisibles = reportesFiltrados.slice(0, cantidadVisible);
  const hayMasPorCargar = cantidadVisible < reportesFiltrados.length;

  return (
    <div className="ver-reportes-page">
      <h2>Reportes del pueblo</h2>
      <p className="ver-reportes-subtitulo">
        Mirá los problemas que reportaron tus vecinos y cómo va su resolución.
      </p>

      {reportes.length > 0 && (
        <div className="filtro-fecha-barra">
          <select
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
          <span className="contador-resultados">
            {reportesFiltrados.length} {reportesFiltrados.length === 1 ? 'reporte' : 'reportes'}
          </span>
        </div>
      )}

      {reportesFiltrados.length === 0 ? (
        <div className="estado-vacio">
          <Inbox size={40} strokeWidth={1.5} />
          <p>{reportes.length === 0 ? 'Todavía no hay reportes cargados.' : 'No hay reportes en ese mes.'}</p>
          {reportes.length === 0 && <span>Sé el primero en reportar un problema de tu barrio.</span>}
        </div>
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
                  onClick={() => setReporteSeleccionado(r)}
                >
                  {r.foto_url && (
                    <img
                      src={`http://localhost:3000${r.foto_url}`}
                      alt="Foto del reporte"
                      className="reporte-foto"
                    />
                  )}
                  <div className="reporte-info">
                    <div className="reporte-header">
                      <span className={`categoria-chip ${color}`}>
                        <Icono size={15} strokeWidth={2} />
                        {r.categoria}
                      </span>
                      <span className={`badge badge-${r.estado}`}>{estadoTexto[r.estado]}</span>
                    </div>
                    <p className="reporte-direccion">{r.direccion}</p>
                    <p className="reporte-descripcion">{r.descripcion}</p>
                    <span className="reporte-fecha">
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