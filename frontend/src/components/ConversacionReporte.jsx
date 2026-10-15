import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { MessageCircle, Send, Camera, ImageIcon, X } from 'lucide-react';
import { comprimirImagen } from '../utils/imagen';
import '../styles/components/ConversacionReporte.css';

const SUGERENCIAS = [
  '¿Podés agregar una foto más clara?',
  '¿Entre qué calles queda exactamente?',
  '¿Hace cuánto tiempo pasa esto?',
];

function ConversacionReporte({ reporteId, modo, onCambio }) {
  const [mensajes, setMensajes] = useState(null);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [foto, setFoto] = useState(null);
  const [vistaFoto, setVistaFoto] = useState('');
  const [procesando, setProcesando] = useState(false);
  const refCamara = useRef(null);
  const refGaleria = useRef(null);

  const esAdmin = modo === 'admin';
  const encabezado = { Authorization: `Bearer ${localStorage.getItem('token')}` };

  const cargar = async () => {
    try {
      const res = await axios.get(`/api/reportes/${reporteId}/mensajes`, { headers: encabezado });
      setMensajes(res.data);
    } catch {
      setMensajes([]);
    }
  };

  useEffect(() => {
    setMensajes(null);
    setTexto('');
    setError('');
    quitarFoto();
    cargar();
  }, [reporteId]);

  function quitarFoto() {
    setVistaFoto((previa) => {
      if (previa) URL.revokeObjectURL(previa);
      return '';
    });
    setFoto(null);
    if (refCamara.current) refCamara.current.value = '';
    if (refGaleria.current) refGaleria.current.value = '';
  }

  const elegirFoto = async (e) => {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setProcesando(true);
    setError('');
    try {
      const comprimida = await comprimirImagen(archivo);
      if (comprimida.size > 5 * 1024 * 1024) {
        setError('La foto es muy pesada. Probá con otra.');
      } else {
        setVistaFoto((previa) => {
          if (previa) URL.revokeObjectURL(previa);
          return URL.createObjectURL(comprimida);
        });
        setFoto(comprimida);
      }
    } catch {
      setError('No se pudo leer esa foto. Probá con otra.');
    } finally {
      setProcesando(false);
      e.target.value = '';
    }
  };

  const enviar = async () => {
    if (!texto.trim() && !foto) {
      setError('Escribí un mensaje o adjuntá una foto.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      const datos = new FormData();
      datos.append('texto', texto);
      if (foto) datos.append('foto', foto);
      await axios.post(`/api/reportes/${reporteId}/mensajes`, datos, {
        headers: { ...encabezado, 'Content-Type': 'multipart/form-data' },
      });
      setTexto('');
      quitarFoto();
      await cargar();
      if (onCambio) onCambio();
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo enviar el mensaje. Probá de nuevo.');
    } finally {
      setEnviando(false);
    }
  };

  if (mensajes === null) return null;

  const hayConsulta = mensajes.some((m) => m.autor === 'admin');
  if (!esAdmin && !hayConsulta) return null;

  const agregarSugerencia = (frase) => {
    setTexto((actual) => (actual.trim() ? `${actual.trim()} ${frase}` : frase).slice(0, 1000));
    setError('');
  };

  const quienEscribe = (m) => {
    if (esAdmin) return m.autor === 'admin' ? (m.autor_nombre || 'Municipalidad') : 'Vecino';
    return m.autor === 'admin' ? 'Municipalidad' : 'Vos';
  };

  return (
    <div className="conversacion">
      <h4>
        <MessageCircle size={16} aria-hidden="true" />
        {esAdmin ? 'Mensajes con el vecino' : 'La Municipalidad te escribió'}
      </h4>

      {mensajes.length === 0 ? (
        <p className="conversacion-vacia">
          Si el reporte no quedó claro, pedile al vecino más detalles. Le va a aparecer en “Mis reportes”.
        </p>
      ) : (
        <ul className="conversacion-lista">
          {mensajes.map((m) => (
            <li key={m.id} className={`mensaje mensaje-${m.autor === 'admin' ? 'municipio' : 'vecino'}`}>
              <span className="mensaje-autor">{quienEscribe(m)}</span>
              {m.texto && <p>{m.texto}</p>}
              {m.foto_url && (
                <a href={m.foto_url} target="_blank" rel="noreferrer" className="mensaje-foto">
                  <img src={m.foto_url} alt="Foto adjunta al mensaje" loading="lazy" />
                </a>
              )}
              <span className="mensaje-fecha">
                {new Date(m.fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </li>
          ))}
        </ul>
      )}

      <label className="conversacion-etiqueta" htmlFor={`mensaje-${reporteId}`}>
        {esAdmin ? 'Pedir más información' : 'Tu respuesta'}
      </label>

      {esAdmin && (
        <div className="conversacion-sugerencias">
          {SUGERENCIAS.map((frase) => (
            <button key={frase} type="button" onClick={() => agregarSugerencia(frase)}>
              {frase}
            </button>
          ))}
        </div>
      )}

      <textarea
        id={`mensaje-${reporteId}`}
        value={texto}
        rows={3}
        maxLength={1000}
        placeholder={esAdmin ? 'Escribile al vecino qué necesitás saber' : 'Escribí tu respuesta'}
        onChange={(e) => { setTexto(e.target.value); setError(''); }}
      />
      {vistaFoto && (
        <div className="conversacion-vista">
          <img src={vistaFoto} alt="Foto a enviar" />
          <button type="button" onClick={quitarFoto} aria-label="Quitar foto">
            <X size={16} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="conversacion-fotos">
        <label className="conversacion-foto-boton">
          <Camera size={18} aria-hidden="true" />
          Sacar foto
          <input ref={refCamara} type="file" accept="image/*" capture="environment" onChange={elegirFoto} hidden />
        </label>
        <label className="conversacion-foto-boton">
          <ImageIcon size={18} aria-hidden="true" />
          Elegir de galería
          <input ref={refGaleria} type="file" accept="image/*" onChange={elegirFoto} hidden />
        </label>
      </div>
      {procesando && <p className="conversacion-vacia">Preparando la foto...</p>}
      {error && <p className="conversacion-error" role="alert">{error}</p>}
      <button type="button" className="conversacion-enviar" onClick={enviar} disabled={enviando || procesando}>
        <Send size={18} aria-hidden="true" />
        {enviando ? 'Enviando...' : esAdmin ? 'Enviar al vecino' : 'Enviar respuesta'}
      </button>
    </div>
  );
}

export default ConversacionReporte;
