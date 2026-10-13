import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/pages/AdminPage.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Inbox, Trash2, Info, X, FileSpreadsheet, FileText } from 'lucide-react';
import { iconoCategoria, colorCategoria } from '../utils/categorias';
import { ESTADOS_TEXTO } from '../utils/estados';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

function AdminPage() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [reporteAEliminar, setReporteAEliminar] = useState(null);
  const [vecinoAVer, setVecinoAVer] = useState(null);
  const { toast, mostrarToast } = useToast();

  const hayModal = Boolean(fotoAmpliada || reporteAEliminar || vecinoAVer);

  useEffect(() => {
    if (!hayModal) return undefined;
    const alTeclear = (e) => {
      if (e.key === 'Escape') {
        setFotoAmpliada(null);
        setReporteAEliminar(null);
        setVecinoAVer(null);
      }
    };
    document.addEventListener('keydown', alTeclear);
    return () => document.removeEventListener('keydown', alTeclear);
  }, [hayModal]);

  const cargarReportes = () => {
    const token = localStorage.getItem('token');
    axios.get('/api/admin/reportes', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => setReportes(res.data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarReportes();
  }, []);

  const cambiarEstado = async (id, nuevoEstado) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/reportes/${id}/estado`,
        { estado: nuevoEstado },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      cargarReportes();
      mostrarToast('Estado actualizado correctamente', 'exito');
    } catch (error) {
      console.error(error);
      mostrarToast('No se pudo actualizar el estado', 'error');
    }
  };

  const eliminarReporte = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/reportes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      cargarReportes();
      mostrarToast('Reporte eliminado correctamente', 'exito');
    } catch (error) {
      console.error(error);
      mostrarToast('No se pudo eliminar el reporte', 'error');
    }
    setReporteAEliminar(null);
  };

  const estadoTexto = ESTADOS_TEXTO;

  const iniciales = (r) => `${(r.usuario_nombre || '?')[0]}${(r.usuario_apellido || '')[0] || ''}`.toUpperCase();

  if (cargando) return <Spinner texto="Cargando reportes..." />;

  const contarPorEstado = (estado) => reportes.filter(r => r.estado === estado).length;

  const categoriasUnicas = [...new Set(reportes.map(r => r.categoria))];
  const reportesFiltrados = reportes.filter(r => {
    const coincideCategoria = filtroCategoria === 'todas' || r.categoria === filtroCategoria;
    const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    return coincideCategoria && coincideEstado;
  });

  const exportarExcel = () => {
    const datosParaExportar = reportesFiltrados.map(r => ({
      Categoría: r.categoria,
      Dirección: r.direccion,
      Descripción: r.descripcion,
      Estado: estadoTexto[r.estado],
      Fecha: new Date(r.fecha_creacion).toLocaleDateString('es-AR')
    }));

    const hoja = XLSX.utils.json_to_sheet(datosParaExportar);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, 'Reportes');

    const excelBuffer = XLSX.write(libro, { bookType: 'xlsx', type: 'array' });
    const archivo = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(archivo, `reportes_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const exportarPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(14);
    doc.text('Reportes Vecinales', 14, 15);
    doc.setFontSize(10);
    doc.text(`Generado el ${new Date().toLocaleDateString('es-AR')}`, 14, 21);

    const filas = reportesFiltrados.map(r => [
      r.categoria,
      r.direccion,
      r.descripcion,
      estadoTexto[r.estado],
      new Date(r.fecha_creacion).toLocaleDateString('es-AR')
    ]);

    autoTable(doc, {
      startY: 27,
      head: [['Categoría', 'Dirección', 'Descripción', 'Estado', 'Fecha']],
      body: filas,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [13, 92, 107] }
    });

    doc.save(`reportes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="admin-page">
      <div className="admin-cabecera">
        <h2>Panel de administración</h2>
        <p className="admin-subtitulo">Revisá los reportes de los vecinos y actualizá cómo avanzan.</p>
      </div>

      <div className="resumen-estados" role="group" aria-label="Filtrar por estado">
        {[
          ['todos', 'Todos', reportes.length],
          ['pendiente', 'Pendientes', contarPorEstado('pendiente')],
          ['en_proceso', 'En proceso', contarPorEstado('en_proceso')],
          ['resuelto', 'Resueltos', contarPorEstado('resuelto')],
        ].map(([valor, texto, cantidad]) => (
          <button
            type="button"
            key={valor}
            className={`resumen resumen-${valor} ${filtroEstado === valor ? 'activo' : ''}`}
            aria-pressed={filtroEstado === valor}
            onClick={() => setFiltroEstado(valor)}
          >
            <span className="resumen-numero">{cantidad}</span>
            <span className="resumen-texto">{texto}</span>
          </button>
        ))}
      </div>

      <div className="admin-barra">
        <select
          className="admin-select"
          aria-label="Filtrar por categoría"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="todas">Todas las categorías</option>
          {categoriasUnicas.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <div className="botones-exportar">
          <button type="button" className="boton-exportar" onClick={exportarExcel}>
            <FileSpreadsheet size={18} aria-hidden="true" />
            Exportar a Excel
          </button>
          <button type="button" className="boton-exportar boton-exportar-pdf" onClick={exportarPDF}>
            <FileText size={18} aria-hidden="true" />
            Exportar a PDF
          </button>
        </div>
      </div>

      {reportesFiltrados.length === 0 ? (
        <div className="estado-vacio">
          <Inbox size={40} strokeWidth={1.5} />
          <p>No hay reportes que coincidan con estos filtros.</p>
        </div>
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>Categoría</th>
                <th>Vecino</th>
                <th>Dirección</th>
                <th>Descripción</th>
                <th>Foto</th>
                <th>Estado</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {reportesFiltrados.map(r => {
                const Icono = iconoCategoria(r.categoria);
                const color = colorCategoria(r.categoria);
                return (
                  <tr key={r.id}>
                    <td data-label="Categoría">
                      <span className={`categoria-chip ${color}`}>
                        <Icono size={15} strokeWidth={2} aria-hidden="true" />
                        {r.categoria}
                      </span>
                    </td>
                    <td data-label="Vecino">
                      <div className="vecino-celda">
                        <span className="vecino-avatar" aria-hidden="true">{iniciales(r)}</span>
                        <span className="vecino-nombre">{r.usuario_nombre} {r.usuario_apellido}</span>
                        <button
                          type="button"
                          className="boton-info-vecino"
                          onClick={() => setVecinoAVer(r)}
                          aria-label={`Ver datos de ${r.usuario_nombre} ${r.usuario_apellido}`}
                        >
                          <Info size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                    <td data-label="Dirección">{r.direccion}</td>
                    <td data-label="Descripción">{r.descripcion}</td>
                    <td data-label="Foto">
                      {r.foto_url && (
                        <button
                          type="button"
                          className="foto-boton"
                          onClick={() => setFotoAmpliada(r.foto_url)}
                          aria-label="Ampliar foto del reporte"
                        >
                          <img src={r.foto_url} alt="" />
                        </button>
                      )}
                    </td>
                    <td data-label="Estado">
                      <div className="estado-celda">
                        <span className={`estado-pill estado-${r.estado}`}>
                          <span className="estado-punto" />
                          {estadoTexto[r.estado]}
                        </span>
                        <select
                          aria-label="Cambiar estado"
                          value={r.estado}
                          onChange={(e) => cambiarEstado(r.id, e.target.value)}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_proceso">En proceso</option>
                          <option value="resuelto">Resuelto</option>
                        </select>
                      </div>
                    </td>
                    <td data-label="Acciones">
                      <button
                        type="button"
                        className="boton-eliminar"
                        onClick={() => setReporteAEliminar(r)}
                        aria-label="Eliminar reporte"
                      >
                        <Trash2 size={18} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {fotoAmpliada && (
        <div className="modal-foto-overlay" onClick={() => setFotoAmpliada(null)}>
          <div
            className="modal-foto-contenido"
            role="dialog"
            aria-modal="true"
            aria-label="Foto ampliada"
            onClick={(e) => e.stopPropagation()}
          >
            <button type="button" className="modal-foto-cerrar" onClick={() => setFotoAmpliada(null)} aria-label="Cerrar">
              <X size={20} aria-hidden="true" />
            </button>
            <img src={fotoAmpliada} alt="Foto ampliada del reporte" />
          </div>
        </div>
      )}

      {reporteAEliminar && (
        <div className="confirmar-overlay" onClick={() => setReporteAEliminar(null)}>
          <div
            className="confirmar-contenido"
            role="alertdialog"
            aria-modal="true"
            aria-label="Confirmar eliminación"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="confirmar-icono" aria-hidden="true"><Trash2 size={24} /></span>
            <p className="confirmar-texto">
              ¿Seguro que querés eliminar este reporte de <strong>{reporteAEliminar.categoria}</strong>?
            </p>
            <p className="confirmar-aviso">Esta acción no se puede deshacer.</p>
            <div className="confirmar-botones">
              <button type="button" className="boton-cancelar" onClick={() => setReporteAEliminar(null)}>
                Cancelar
              </button>
              <button type="button" className="boton-confirmar-eliminar" onClick={() => eliminarReporte(reporteAEliminar.id)}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {vecinoAVer && (
        <div className="confirmar-overlay" onClick={() => setVecinoAVer(null)}>
          <div
            className="confirmar-contenido"
            role="dialog"
            aria-modal="true"
            aria-label="Datos del vecino"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="vecino-avatar vecino-avatar-grande" aria-hidden="true">{iniciales(vecinoAVer)}</span>
            <h3 className="vecino-modal-titulo">{vecinoAVer.usuario_nombre} {vecinoAVer.usuario_apellido}</h3>
            <dl className="vecino-datos">
              <dt>DNI</dt>
              <dd>{vecinoAVer.usuario_dni}</dd>
            </dl>
            <div className="confirmar-botones">
              <button type="button" className="boton-cancelar" onClick={() => setVecinoAVer(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} />
    </div>
  );
}

export default AdminPage;
