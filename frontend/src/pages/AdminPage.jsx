import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/pages/AdminPage.css';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Trash2, Info, Eye, Search, Copy, X, RefreshCw, MessageCircle, FileSpreadsheet, FileText } from 'lucide-react';
import { iconoCategoria, colorCategoria, etiquetaCategoria } from '../utils/categorias';
import { ESTADOS_TEXTO } from '../utils/estados';
import { detectarDuplicados } from '../utils/duplicados';
import { prioridadDe, PRIORIDAD_TEXTO, PRIORIDAD_ORDEN, tiempoMedioDeRespuesta, textoDuracion } from '../utils/prioridad';
import Spinner from '../components/Spinner';
import PantallaEstado from '../components/PantallaEstado';
import MapaCalor from '../components/MapaCalor';
import DetalleReporteModal from '../components/DetalleReporteModal';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';

function AdminPage() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState('todas');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroPrioridad, setFiltroPrioridad] = useState('todas');
  const [busqueda, setBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [soloDuplicados, setSoloDuplicados] = useState(false);
  const [seleccion, setSeleccion] = useState(() => new Set());
  const [estadoLote, setEstadoLote] = useState('');
  const [responsableLote, setResponsableLote] = useState('');
  const [aplicandoLote, setAplicandoLote] = useState(false);
  const [idDetalle, setIdDetalle] = useState(null);
  const [reporteAEliminar, setReporteAEliminar] = useState(null);
  const [vecinoAVer, setVecinoAVer] = useState(null);
  const { toast, mostrarToast } = useToast();

  const hayModal = Boolean(reporteAEliminar || vecinoAVer);

  useEffect(() => {
    if (!hayModal) return undefined;
    const alTeclear = (e) => {
      if (e.key === 'Escape') {
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
      .then(res => {
        setReportes(res.data);
        setErrorCarga(false);
      })
      .catch(err => {
        console.error(err);
        if (err.response?.status !== 401) setErrorCarga(true);
      })
      .finally(() => setCargando(false));
  };

  const reintentarCarga = () => {
    setCargando(true);
    cargarReportes();
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

  const guardarGestion = async (id, datos) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/reportes/${id}/gestion`, datos, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      cargarReportes();
      mostrarToast('Datos guardados', 'exito');
    } catch (error) {
      console.error(error);
      mostrarToast('No se pudieron guardar los datos', 'error');
    }
  };

  const cargarHistorial = async (id) => {
    const token = localStorage.getItem('token');
    const res = await axios.get(`/api/admin/reportes/${id}/historial`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res.data;
  };

  const aplicarLote = async (cambios, textoExito) => {
    setAplicandoLote(true);
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/reportes-lote', { ids: idsSeleccionados, ...cambios }, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      cargarReportes();
      setSeleccion(new Set());
      setEstadoLote('');
      setResponsableLote('');
      mostrarToast(textoExito, 'exito');
    } catch (error) {
      console.error(error);
      mostrarToast('No se pudieron actualizar los reportes', 'error');
    } finally {
      setAplicandoLote(false);
    }
  };

  const alternarSeleccion = (id) => {
    setSeleccion((previa) => {
      const nueva = new Set(previa);
      if (nueva.has(id)) nueva.delete(id);
      else nueva.add(id);
      return nueva;
    });
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

  const diasDesde = (fecha) => Math.max(0, Math.floor((Date.now() - new Date(fecha).getTime()) / 86400000));

  const textoAntiguedad = (fecha) => {
    const dias = diasDesde(fecha);
    if (dias === 0) return 'Hoy';
    return dias === 1 ? '1 día' : `${dias} días`;
  };

  const iniciales = (r) => `${(r.usuario_nombre || '?')[0]}${(r.usuario_apellido || '')[0] || ''}`.toUpperCase();

  if (cargando) return <Spinner texto="Cargando reportes..." />;

  if (errorCarga && reportes.length === 0) {
    return (
      <PantallaEstado tipo="conexion">
        <button type="button" className="pantalla-boton" onClick={reintentarCarga}>
          <RefreshCw size={18} aria-hidden="true" />
          Reintentar
        </button>
      </PantallaEstado>
    );
  }

  const contarPorEstado = (estado) => reportes.filter(r => r.estado === estado).length;

  const categoriasUnicas = [...new Set(reportes.map(r => r.categoria))];
  const normalizar = (texto) => String(texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  const duplicados = detectarDuplicados(reportes);

  const terminos = normalizar(busqueda).split(/\s+/).filter(Boolean);
  const desde = fechaDesde ? new Date(`${fechaDesde}T00:00:00`) : null;
  const hasta = fechaHasta ? new Date(`${fechaHasta}T23:59:59`) : null;

  const reportesFiltrados = reportes.filter(r => {
    const coincideCategoria = filtroCategoria === 'todas' || r.categoria === filtroCategoria;
    const coincideEstado = filtroEstado === 'todos' || r.estado === filtroEstado;
    const coincidePrioridad = filtroPrioridad === 'todas' || prioridadDe(r) === filtroPrioridad;
    const fecha = new Date(r.fecha_creacion);
    const coincideFecha = (!desde || fecha >= desde) && (!hasta || fecha <= hasta);
    const textoReporte = normalizar(
      `${r.direccion} ${r.descripcion} ${r.categoria} ${r.categoria_otro || ''} ${r.usuario_nombre} ${r.usuario_apellido} ${r.usuario_dni} ${r.responsable || ''}`
    );
    const coincideTexto = terminos.every(t => textoReporte.includes(t));
    const coincideDuplicado = !soloDuplicados || duplicados.has(r.id);
    return coincideCategoria && coincideEstado && coincidePrioridad && coincideFecha && coincideTexto && coincideDuplicado;
  });

  const hayFiltros = filtroCategoria !== 'todas' || filtroEstado !== 'todos' || filtroPrioridad !== 'todas'
    || busqueda.trim() !== '' || fechaDesde !== '' || fechaHasta !== '' || soloDuplicados;

  const limpiarFiltros = () => {
    setFiltroCategoria('todas');
    setFiltroEstado('todos');
    setFiltroPrioridad('todas');
    setBusqueda('');
    setFechaDesde('');
    setFechaHasta('');
    setSoloDuplicados(false);
  };

  const DIAS_ANTIGUO = 7;
  const pendientesAntiguos = reportes.filter(
    r => r.estado === 'pendiente' && diasDesde(r.fecha_creacion) >= DIAS_ANTIGUO
  ).length;
  const nuevosEstaSemana = reportes.filter(r => diasDesde(r.fecha_creacion) < DIAS_ANTIGUO).length;
  const porcentajeResueltos = reportes.length
    ? Math.round((contarPorEstado('resuelto') / reportes.length) * 100)
    : 0;

  const notasResumen = {
    todos: `${nuevosEstaSemana} nuevos esta semana`,
    pendiente: pendientesAntiguos > 0 ? `${pendientesAntiguos} con más de ${DIAS_ANTIGUO} días` : 'Al día',
    en_proceso: 'Se están atendiendo',
    resuelto: `${porcentajeResueltos}% del total`,
  };

  const PESO_ESTADO = { pendiente: 0, en_proceso: 1, resuelto: 2 };
  const reportesOrdenados = [...reportesFiltrados].sort((a, b) => {
    if (PESO_ESTADO[a.estado] !== PESO_ESTADO[b.estado]) {
      return PESO_ESTADO[a.estado] - PESO_ESTADO[b.estado];
    }
    const prioridadA = prioridadDe(a);
    const prioridadB = prioridadDe(b);
    if (prioridadA && prioridadB && prioridadA !== prioridadB) {
      return PRIORIDAD_ORDEN[prioridadA] - PRIORIDAD_ORDEN[prioridadB];
    }
    return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
  });

  const tiempoMedio = tiempoMedioDeRespuesta(reportes);

  const idsSeleccionados = reportesFiltrados.filter(r => seleccion.has(r.id)).map(r => r.id);
  const todosMarcados = reportesFiltrados.length > 0 && idsSeleccionados.length === reportesFiltrados.length;
  const alternarTodos = () => {
    setSeleccion(todosMarcados ? new Set() : new Set(reportesFiltrados.map(r => r.id)));
  };

  const conteoPorCategoria = Object.entries(
    reportes.reduce((acc, r) => ({ ...acc, [r.categoria]: (acc[r.categoria] || 0) + 1 }), {})
  ).sort((a, b) => b[1] - a[1]);
  const maximoCategoria = conteoPorCategoria.length ? conteoPorCategoria[0][1] : 1;

  const exportarExcel = () => {
    const datosParaExportar = reportesFiltrados.map(r => ({
      Categoría: r.categoria,
      Dirección: r.direccion,
      Descripción: r.descripcion,
      Prioridad: prioridadDe(r) ? PRIORIDAD_TEXTO[prioridadDe(r)] : '',
      Responsable: r.responsable || '',
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
        <p className="admin-subtitulo">Revisa los reportes de los vecinos y actualizá cómo avanzan.</p>
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
            <span className={`resumen-nota ${valor === 'pendiente' && pendientesAntiguos > 0 ? 'resumen-nota-alerta' : ''}`}>
              {notasResumen[valor]}
            </span>
          </button>
        ))}
        <div className="resumen resumen-tiempo">
          <span className="resumen-numero">{tiempoMedio ? textoDuracion(tiempoMedio.dias) : '—'}</span>
          <span className="resumen-texto">Tiempo de respuesta</span>
          <span className="resumen-nota">
            {tiempoMedio
              ? `Promedio de ${tiempoMedio.cantidad} ${tiempoMedio.cantidad === 1 ? 'resuelto' : 'resueltos'}`
              : 'Se calcula al resolver reportes'}
          </span>
        </div>
      </div>

      <div className="admin-barra">
        <div className="admin-filtros">
          <label className="admin-buscador">
            <Search size={18} aria-hidden="true" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por dirección, descripción, vecino o DNI"
              aria-label="Buscar reportes"
            />
          </label>

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

          <select
            className="admin-select"
            aria-label="Filtrar por prioridad"
            value={filtroPrioridad}
            onChange={(e) => setFiltroPrioridad(e.target.value)}
          >
            <option value="todas">Todas las prioridades</option>
            <option value="alta">Prioridad alta</option>
            <option value="media">Prioridad media</option>
            <option value="baja">Prioridad baja</option>
          </select>

          <label className="admin-check">
            <input type="checkbox" checked={soloDuplicados} onChange={(e) => setSoloDuplicados(e.target.checked)} />
            Solo posibles repetidos
          </label>
          <label className="admin-fecha">
            <span>Desde</span>
            <input type="date" value={fechaDesde} max={fechaHasta || undefined} onChange={(e) => setFechaDesde(e.target.value)} />
          </label>
          <label className="admin-fecha">
            <span>Hasta</span>
            <input type="date" value={fechaHasta} min={fechaDesde || undefined} onChange={(e) => setFechaHasta(e.target.value)} />
          </label>
        </div>

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

      {hayFiltros && (
        <p className="admin-resultado" role="status">
          Mostrando {reportesFiltrados.length} de {reportes.length} reportes.
          <button type="button" className="admin-limpiar" onClick={limpiarFiltros}>Limpiar filtros</button>
        </p>
      )}

      <div className="admin-seccion-titulo">
        <h3>Para atender primero</h3>
        <p>Pendientes primero, por prioridad y, a igual prioridad, los más antiguos.</p>
      </div>

      {idsSeleccionados.length > 0 && (
        <div className="barra-lote" role="region" aria-label="Acciones sobre los reportes elegidos">
          <p className="lote-cantidad">
            {idsSeleccionados.length} {idsSeleccionados.length === 1 ? 'reporte elegido' : 'reportes elegidos'}
          </p>

          <div className="lote-grupo">
            <select
              aria-label="Nuevo estado para los reportes elegidos"
              value={estadoLote}
              onChange={(e) => setEstadoLote(e.target.value)}
            >
              <option value="">Cambiar estado a...</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_proceso">En proceso</option>
              <option value="resuelto">Resuelto</option>
            </select>
            <button
              type="button"
              className="lote-boton"
              disabled={!estadoLote || aplicandoLote}
              onClick={() => aplicarLote({ estado: estadoLote }, 'Estado actualizado en los reportes elegidos')}
            >
              Aplicar
            </button>
          </div>

          <div className="lote-grupo">
            <input
              type="text"
              value={responsableLote}
              maxLength={100}
              placeholder="Responsable (persona o área)"
              aria-label="Responsable para los reportes elegidos"
              onChange={(e) => setResponsableLote(e.target.value)}
            />
            <button
              type="button"
              className="lote-boton"
              disabled={!responsableLote.trim() || aplicandoLote}
              onClick={() => aplicarLote({ responsable: responsableLote }, 'Responsable asignado a los reportes elegidos')}
            >
              Asignar
            </button>
          </div>

          <button type="button" className="lote-cancelar" onClick={() => setSeleccion(new Set())}>
            <X size={16} aria-hidden="true" />
            Quitar selección
          </button>
        </div>
      )}

      {reportesFiltrados.length === 0 ? (
        reportes.length === 0 ? (
          <PantallaEstado tipo="vacio" />
        ) : (
          <PantallaEstado tipo="sinResultados">
            <button type="button" className="pantalla-boton pantalla-boton-suave" onClick={limpiarFiltros}>
              <X size={18} aria-hidden="true" />
              Limpiar filtros
            </button>
          </PantallaEstado>
        )
      ) : (
        <div className="tabla-scroll">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="casilla-fila"
                    checked={todosMarcados}
                    onChange={alternarTodos}
                    aria-label="Elegir todos los reportes de la lista"
                  />
                </th>
                <th>Prioridad</th>
                <th>Categoría</th>
                <th>Vecino</th>
                <th>Dirección</th>
                <th>Descripción</th>
                <th>Foto</th>
                <th>Antigüedad</th>
                <th>Responsable</th>
                <th>Estado</th>
                <th><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {reportesOrdenados.map(r => {
                const Icono = iconoCategoria(r.categoria);
                const color = colorCategoria(r.categoria);
                const prioridad = prioridadDe(r);
                return (
                  <tr key={r.id} className={seleccion.has(r.id) ? 'fila-elegida' : ''}>
                    <td data-label="Elegir">
                      <input
                        type="checkbox"
                        className="casilla-fila"
                        checked={seleccion.has(r.id)}
                        onChange={() => alternarSeleccion(r.id)}
                        aria-label={`Elegir el reporte de ${r.categoria} en ${r.direccion}`}
                      />
                    </td>
                    <td data-label="Prioridad">
                      {prioridad ? (
                        <span className={`prioridad prioridad-${prioridad}`}>{PRIORIDAD_TEXTO[prioridad]}</span>
                      ) : (
                        <span className="prioridad-vacia" aria-label="Sin prioridad, ya resuelto">—</span>
                      )}
                    </td>
                    <td data-label="Categoría">
                      <span className={`categoria-chip ${color}`}>
                        <Icono size={15} strokeWidth={2} aria-hidden="true" />
                        {etiquetaCategoria(r)}
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
                    <td data-label="Descripción">
                      {r.descripcion}
                      {r.ultimo_mensaje_autor && (
                        <span className={`etiqueta-mensaje ${r.ultimo_mensaje_autor === 'vecino' ? 'etiqueta-mensaje-respondio' : ''}`}>
                          <MessageCircle size={13} aria-hidden="true" />
                          {r.ultimo_mensaje_autor === 'vecino' ? 'El vecino respondió' : 'Esperando respuesta del vecino'}
                        </span>
                      )}
                      {duplicados.has(r.id) && (
                        <button
                          type="button"
                          className="etiqueta-repetido"
                          onClick={() => setIdDetalle(r.id)}
                          aria-label={`Posible repetido: hay ${duplicados.get(r.id).length} reporte(s) parecido(s) cerca. Ver detalle`}
                        >
                          <Copy size={13} aria-hidden="true" />
                          Posible repetido ({duplicados.get(r.id).length})
                        </button>
                      )}
                    </td>
                    <td data-label="Foto">
                      {r.foto_url && (
                        <button
                          type="button"
                          className="foto-boton"
                          onClick={() => setIdDetalle(r.id)}
                          aria-label="Ver detalle del reporte"
                        >
                          <img src={r.foto_url} alt="" />
                        </button>
                      )}
                    </td>
                    <td data-label="Antigüedad">
                      <span className={`antiguedad ${r.estado !== 'resuelto' && diasDesde(r.fecha_creacion) >= DIAS_ANTIGUO ? 'antiguedad-alerta' : ''}`}>
                        {textoAntiguedad(r.fecha_creacion)}
                      </span>
                    </td>
                    <td data-label="Responsable">
                      {r.responsable
                        ? <span className="responsable">{r.responsable}</span>
                        : <span className="responsable-vacio">Sin asignar</span>}
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
                      <div className="acciones-celda">
                        <button
                          type="button"
                          className="boton-ver"
                          onClick={() => setIdDetalle(r.id)}
                          aria-label="Ver detalle del reporte"
                        >
                          <Eye size={18} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="boton-eliminar"
                          onClick={() => setReporteAEliminar(r)}
                          aria-label="Eliminar reporte"
                        >
                          <Trash2 size={18} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {reportes.length > 0 && (
        <div className="admin-paneles">
          <section className="admin-panel">
            <h3>Dónde se concentran</h3>
            <div className="admin-mapa">
              <MapaCalor reportes={reportesFiltrados} />
            </div>
            <p className="admin-panel-nota">
              Muestra los reportes que estás viendo en la lista. Los círculos más oscuros son zonas con varios reportes juntos.
            </p>
          </section>

          <section className="admin-panel">
            <h3>Reportes por categoría</h3>
            <ul className="barras">
              {conteoPorCategoria.map(([categoria, cantidad]) => (
                <li
                  key={categoria}
                  className={`barra-fila ${colorCategoria(categoria).replace('color-', 'tono-')}`}
                >
                  <span className="barra-nombre">{categoria}</span>
                  <span className="barra-pista">
                    <span className="barra-relleno" style={{ width: `${(cantidad / maximoCategoria) * 100}%` }} />
                  </span>
                  <span className="barra-numero">{cantidad}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}

      <DetalleReporteModal
        reporte={reportes.find((r) => r.id === idDetalle) || null}
        onCerrar={() => setIdDetalle(null)}
        admin={{
          onCambiarEstado: cambiarEstado,
          onGuardarGestion: guardarGestion,
          onMensajeEnviado: cargarReportes,
          cargarHistorial,
          repetidos: (duplicados.get(idDetalle) || [])
            .map((d) => ({ ...d, reporte: reportes.find((x) => x.id === d.id) }))
            .filter((d) => d.reporte)
            .sort((a, b) => a.metros - b.metros),
          onVerReporte: setIdDetalle,
          onEliminar: (r) => {
            setIdDetalle(null);
            setReporteAEliminar(r);
          },
        }}
      />

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
              ¿Seguro que quieres eliminar este reporte de <strong>{reporteAEliminar.categoria}</strong>?
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
