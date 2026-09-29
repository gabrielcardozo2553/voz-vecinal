import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/pages/AdminPage.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Inbox, Trash2, Info } from 'lucide-react';
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

  const cargarReportes = () => {
    const token = localStorage.getItem('token');
    axios.get('http://localhost:3000/api/admin/reportes', {
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
        `http://localhost:3000/api/reportes/${id}/estado`,
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
      await axios.delete(`http://localhost:3000/api/reportes/${id}`, {
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

  const estadoTexto = {
    pendiente: 'Pendiente',
    en_proceso: 'En proceso',
    resuelto: 'Resuelto'
  };

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
      headStyles: { fillColor: [30, 95, 140] }
    });

    doc.save(`reportes_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="admin-page">
      <h2>Panel de administración</h2>
      <div className="resumen-estados">
        <span className="resumen resumen-pendiente">Pendientes: {contarPorEstado('pendiente')}</span>
        <span className="resumen resumen-en_proceso">En proceso: {contarPorEstado('en_proceso')}</span>
        <span className="resumen resumen-resuelto">Resueltos: {contarPorEstado('resuelto')}</span>
      </div>
      <div className="filtros">
        <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}>
          <option value="todas">Todas las categorías</option>
          {categoriasUnicas.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="en_proceso">En proceso</option>
          <option value="resuelto">Resuelto</option>
        </select>
      </div>

      <div className="botones-exportar">
        <button type="button" className="boton-exportar" onClick={exportarExcel}>
          📥 Exportar a Excel
        </button>
        <button type="button" className="boton-exportar boton-exportar-pdf" onClick={exportarPDF}>
          📄 Exportar a PDF
        </button>
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
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {reportesFiltrados.map(r => (
                <tr key={r.id}>
                  <td data-label="Categoría">{r.categoria}</td>
                  <td data-label="Vecino">
                    <div className="vecino-celda">
                      <span>{r.usuario_nombre} {r.usuario_apellido}</span>
                      <button
                        type="button"
                        className="boton-info-vecino"
                        onClick={() => setVecinoAVer(r)}
                      >
                        <Info size={15} />
                      </button>
                    </div>
                  </td>
                  <td data-label="Dirección">{r.direccion}</td>
                  <td data-label="Descripción">{r.descripcion}</td>
                  <td data-label="Foto">
                    {r.foto_url && (
                      <img
                        src={`http://localhost:3000${r.foto_url}`}
                        alt=""
                        className="foto-clickeable"
                        onClick={() => setFotoAmpliada(`http://localhost:3000${r.foto_url}`)}
                      />
                    )}
                  </td>
                  <td data-label="Estado">
                    <div className="estado-celda">
                      <span className={`badge badge-${r.estado}`}>{estadoTexto[r.estado]}</span>
                      <select value={r.estado} onChange={(e) => cambiarEstado(r.id, e.target.value)}>
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
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {fotoAmpliada && (
        <div className="modal-foto-overlay" onClick={() => setFotoAmpliada(null)}>
          <div className="modal-foto-contenido" onClick={(e) => e.stopPropagation()}>
            <button className="modal-foto-cerrar" onClick={() => setFotoAmpliada(null)}>✕</button>
            <img src={fotoAmpliada} alt="Foto ampliada" />
          </div>
        </div>
      )}

      {reporteAEliminar && (
        <div className="confirmar-overlay" onClick={() => setReporteAEliminar(null)}>
          <div className="confirmar-contenido" onClick={(e) => e.stopPropagation()}>
            <p>¿Seguro que querés eliminar este reporte de <strong>{reporteAEliminar.categoria}</strong>?</p>
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
          <div className="confirmar-contenido" onClick={(e) => e.stopPropagation()}>
            <h3 className="vecino-modal-titulo">Datos del vecino</h3>
            <p><strong>Nombre:</strong> {vecinoAVer.usuario_nombre} {vecinoAVer.usuario_apellido}</p>
            <p><strong>DNI:</strong> {vecinoAVer.usuario_dni}</p>
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