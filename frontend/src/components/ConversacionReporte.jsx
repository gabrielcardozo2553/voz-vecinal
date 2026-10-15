import { useEffect, useState } from 'react';
import axios from 'axios';
import { MessageCircle, Send } from 'lucide-react';
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
    cargar();
  }, [reporteId]);

  const enviar = async () => {
    if (!texto.trim()) {
      setError('Escribí un mensaje primero.');
      return;
    }
    setEnviando(true);
    setError('');
    try {
      await axios.post(`/api/reportes/${reporteId}/mensajes`, { texto }, { headers: encabezado });
      setTexto('');
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
              <p>{m.texto}</p>
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
      {error && <p className="conversacion-error" role="alert">{error}</p>}
      <button type="button" className="conversacion-enviar" onClick={enviar} disabled={enviando}>
        <Send size={18} aria-hidden="true" />
        {enviando ? 'Enviando...' : esAdmin ? 'Enviar al vecino' : 'Enviar respuesta'}
      </button>
    </div>
  );
}

export default ConversacionReporte;
