import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/pages/MisReportesPage.css';
import { iconoCategoria, colorCategoria } from '../utils/categorias';
import { Inbox } from 'lucide-react';
import Spinner from '../components/Spinner';
import DetalleReporteModal from '../components/DetalleReporteModal';

function MisReportesPage() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [reporteSeleccionado, setReporteSeleccionado] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    axios.get('/api/mis-reportes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => setReportes(res.data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  const estadoTexto = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    resuelto: 'Resuelto'
  };

  if (cargando) return <Spinner texto="Cargando tus reportes..." />;

  return (
    <div className="mis-reportes-page">
      <h2>Mis reportes</h2>
      <p className="mis-reportes-subtitulo">
        Estos son los problemas que reportaste vos. Tocá uno para ver el detalle completo.
      </p>

      {reportes.length === 0 ? (
        <div className="estado-vacio">
          <Inbox size={40} strokeWidth={1.5} />
          <p>Todavía no hiciste ningún reporte.</p>
          <span>Cuando reportes un problema, va a aparecer acá.</span>
        </div>
      ) : (
        <div className="reportes-grid">
          {reportes.map(r => {
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
                    src={r.foto_url}
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
      )}

      <DetalleReporteModal
        reporte={reporteSeleccionado}
        onCerrar={() => setReporteSeleccionado(null)}
      />
    </div>
  );
}

export default MisReportesPage;