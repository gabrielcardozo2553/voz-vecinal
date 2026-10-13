import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/pages/ReportarPage.css';
import { useAuth } from '../context/AuthContext';
import { Send, Check, CheckCircle, LocateFixed, Camera, ImageIcon, X, MapPin, Lightbulb, Plus, ShieldCheck } from 'lucide-react';
import { iconoCategoria, colorCategoria } from '../utils/categorias';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import SelectorUbicacion from '../components/SelectorUbicacion';
import { comprimirImagen } from '../utils/imagen';

const TAMANO_MAXIMO_MB = 5;

const MAX_DESCRIPCION = 300;

const FRASES_RAPIDAS = ['Hace varios días', 'Es peligroso', 'Afecta a varias casas'];

const FORMULARIO_VACIO = {
  categoria_id: '',
  descripcion: '',
  direccion: '',
};

function ReportarPage() {
  const { usuario } = useAuth();
  const { toast, mostrarToast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState(FORMULARIO_VACIO);

  const [ubicacion, setUbicacion] = useState({ lat: null, lng: null });
  const [buscandoUbicacion, setBuscandoUbicacion] = useState(false);
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [procesandoFoto, setProcesandoFoto] = useState(false);
  const [mensajeFoto, setMensajeFoto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    axios.get('/api/categorias')
      .then(res => setCategorias(res.data))
      .catch(err => console.error(err));
  }, []);

  if (!usuario) {
    return <p>Tenés que <a href="/login">iniciar sesión</a> para reportar un problema.</p>;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCategoriaClick = (id) => {
    setFormData({ ...formData, categoria_id: id });
  };

  const handleFraseRapida = (frase) => {
    const actual = formData.descripcion.trim();
    if (actual.toLowerCase().includes(frase.toLowerCase())) return;
    const nueva = actual ? `${actual}. ${frase}` : frase;
    setFormData({ ...formData, descripcion: nueva.slice(0, MAX_DESCRIPCION) });
  };

  const handleUsarMiUbicacion = () => {
    if (!navigator.geolocation) {
      mostrarToast('Tu navegador no permite obtener la ubicación.', 'error');
      return;
    }
    setBuscandoUbicacion(true);
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({ lat: posicion.coords.latitude, lng: posicion.coords.longitude });
        setBuscandoUbicacion(false);
      },
      () => {
        setBuscandoUbicacion(false);
        mostrarToast('No pudimos obtener tu ubicación. Podés marcarla en el mapa.', 'error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFotoChange = async (e) => {
    const entrada = e.target;
    const archivo = entrada.files[0];

    if (!archivo) return;

    setProcesandoFoto(true);
    setMensajeFoto('');

    let resultado;
    try {
      resultado = await comprimirImagen(archivo);
    } catch {
      resultado = archivo;
    }

    entrada.value = '';
    setProcesandoFoto(false);

    const tamanoMB = resultado.size / (1024 * 1024);
    if (tamanoMB > TAMANO_MAXIMO_MB) {
      setMensajeFoto(`La foto pesa ${tamanoMB.toFixed(1)}MB y el máximo es ${TAMANO_MAXIMO_MB}MB. Probá con otra.`);
      return;
    }

    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(resultado);
    setFotoPreview(URL.createObjectURL(resultado));
    setMensaje('');
  };

  const handleQuitarFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
    setMensajeFoto('');
  };

  const reiniciarFormulario = () => {
    setFormData(FORMULARIO_VACIO);
    setUbicacion({ lat: null, lng: null });
    handleQuitarFoto();
    setMensaje('');
    setEnviado(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.categoria_id) {
      setMensaje('Por favor, elegí una categoría.');
      return;
    }

    if (!foto) {
      setMensaje('Por favor, adjuntá una foto del problema.');
      return;
    }

    setEnviando(true);
    setMensaje('');

    const data = new FormData();
    data.append('categoria_id', formData.categoria_id);
    data.append('descripcion', formData.descripcion);
    data.append('direccion', formData.direccion);
    data.append('usuario_id', usuario.id);
    if (ubicacion.lat && ubicacion.lng) {
      data.append('latitud', ubicacion.lat);
      data.append('longitud', ubicacion.lng);
    }
    if (foto) data.append('foto', foto);

    const token = localStorage.getItem('token');

    try {
      await axios.post('/api/reportes', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setEnviado(true);
    } catch (error) {
      console.error(error);
      mostrarToast('Hubo un error al enviar el reporte. Probá de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  if (enviado) {
    return (
      <div className="reportar-page reportar-exito" role="status">
        <CheckCircle className="exito-icono" size={56} strokeWidth={1.6} aria-hidden="true" />
        <h2>¡Reporte enviado!</h2>
        <p className="reportar-subtitulo">
          Le llegó a la Municipalidad. Podés seguir cómo avanza desde “Mis reportes”.
        </p>
        <div className="exito-acciones">
          <Link to="/mis-reportes" className="boton-principal">Ver mis reportes</Link>
          <button type="button" className="boton-secundario" onClick={reiniciarFormulario}>
            Hacer otro reporte
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="reportar-page">
      <div className="reportar-hero">
        <div>
          <h2>¿Qué pasa en tu barrio?</h2>
          <p className="reportar-subtitulo">Son tres pasos y tu reporte le llega directo a la Municipalidad.</p>
        </div>
        <svg className="hero-dibujo" width="92" height="72" viewBox="0 0 92 72" aria-hidden="true">
          <g stroke="#f2b134" strokeWidth="3" strokeLinecap="round" fill="none"><path d="M46 13v7" transform="rotate(-75 46 46)" /><path d="M46 13v7" transform="rotate(-50 46 46)" /><path d="M46 13v7" transform="rotate(-25 46 46)" /><path d="M46 13v7" transform="rotate(25 46 46)" /><path d="M46 13v7" transform="rotate(50 46 46)" /><path d="M46 13v7" transform="rotate(75 46 46)" /></g>
          <path d="M22 46A24 24 0 0 1 70 46Z" fill="#f2b134" />
          <rect x="44" y="14" width="4" height="34" fill="#0b3f4a" />
          <rect x="39" y="20" width="14" height="3" fill="#0b3f4a" />
          <rect x="35" y="29" width="22" height="4" fill="#0b3f4a" />
          <path d="M4 54q7-4 14 0t14 0t14 0t14 0t14 0t14 0" stroke="#0d5c6b" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M14 63q7-4 14 0t14 0t14 0t14 0" stroke="#7fb4bd" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>
      <form onSubmit={handleSubmit}>

        <section className="reportar-paso">
          <div className="paso-titulo">
            <span className="paso-numero">1</span>
            <div>
              <h3>¿Qué tipo de problema es?</h3>
              <p className="paso-sub">Elegí uno</p>
            </div>
          </div>
          <div className="categoria-grid">
            {categorias.map(cat => {
              const Icono = iconoCategoria(cat.nombre);
              const estaSeleccionada = formData.categoria_id === cat.id;
              const color = colorCategoria(cat.nombre);
              const tono = color.replace('color-', 'tono-');
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`categoria-boton ${tono} ${estaSeleccionada ? 'seleccionada' : ''}`}
                  aria-pressed={estaSeleccionada}
                  onClick={() => handleCategoriaClick(cat.id)}
                >
                  <span className="categoria-burbuja">
                    <Icono size={24} strokeWidth={1.9} aria-hidden="true" />
                  </span>
                  <span className="categoria-nombre">{cat.nombre}</span>
                  {estaSeleccionada && (
                    <span className="check-icono">
                      <Check size={12} strokeWidth={3.5} aria-hidden="true" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <section className="reportar-paso">
          <div className="paso-titulo">
            <span className="paso-numero">2</span>
            <div>
              <h3>¿Dónde está?</h3>
              <p className="paso-sub">Usá tu ubicación o marcalo en el mapa</p>
            </div>
          </div>
          <button
            type="button"
            className="boton-ubicacion"
            onClick={handleUsarMiUbicacion}
            disabled={buscandoUbicacion}
          >
            <LocateFixed size={22} aria-hidden="true" />
            {buscandoUbicacion ? 'Buscando tu ubicación...' : 'Usar mi ubicación actual'}
          </button>
          <div className="mapa-selector">
            <SelectorUbicacion
              latitud={ubicacion.lat}
              longitud={ubicacion.lng}
              onSeleccionar={(lat, lng) => setUbicacion({ lat, lng })}
            />
            {ubicacion.lat && (
              <span className="mapa-chip"><span className="mapa-chip-punto" />Punto marcado</span>
            )}
          </div>
          <p className="ayuda-campo">Si querés, tocá el mapa para marcar el punto exacto.</p>
          <div className="campo">
            <label htmlFor="direccion">Dirección o referencia</label>
            <div className="input-con-icono">
            <MapPin size={20} aria-hidden="true" />
            <input
              id="direccion"
              type="text"
              name="direccion"
              value={formData.direccion}
              onChange={handleChange}
              placeholder="Ej: Sarmiento y Urquiza, frente a la plaza"
              required
            />
            </div>
          </div>
        </section>

        <section className="reportar-paso">
          <div className="paso-titulo">
            <span className="paso-numero">3</span>
            <div>
              <h3>Sumá una foto y contanos</h3>
              <p className="paso-sub">La foto es obligatoria</p>
            </div>
          </div>

          <div className="foto-dropzone">
            {fotoPreview ? (
              <div className="foto-preview-contenedor">
                <img src={fotoPreview} alt="Vista previa de la foto del problema" className="foto-preview" />
                <button
                  type="button"
                  className="foto-quitar"
                  onClick={handleQuitarFoto}
                  aria-label="Quitar foto"
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            ) : (
              <>
                <Camera size={34} strokeWidth={1.6} className="foto-icono" aria-hidden="true" />
                <p className="foto-titulo">Una foto ayuda a la cuadrilla</p>
                <p className="foto-ayuda">La foto es obligatoria. Así llegan sabiendo qué herramientas llevar.</p>
              </>
            )}
            <div className="foto-botones">
              <label className="boton-foto boton-foto-principal">
                <Camera size={20} aria-hidden="true" />
                Sacar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFotoChange}
                  className="visualmente-oculto"
                />
              </label>
              <label className="boton-foto boton-foto-secundario">
                <ImageIcon size={20} aria-hidden="true" />
                Elegir de galería
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFotoChange}
                  className="visualmente-oculto"
                />
              </label>
            </div>
          </div>
          {procesandoFoto && <p className="foto-estado" role="status">Preparando la foto...</p>}
          {mensajeFoto && <p className="mensaje-error" role="alert">{mensajeFoto}</p>}
          <p className="foto-consejo">
            <Lightbulb size={18} aria-hidden="true" />
            Sacala de día y con buena luz, así se ve mejor el problema.
          </p>

          <div className="campo">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Contá qué viste y desde cuándo pasa"
              maxLength={MAX_DESCRIPCION}
              required
            />
            <span className="contador">{formData.descripcion.length} / {MAX_DESCRIPCION}</span>
          </div>
          <div className="frases-rapidas">
            {FRASES_RAPIDAS.map(frase => (
              <button
                type="button"
                key={frase}
                className="frase-rapida"
                onClick={() => handleFraseRapida(frase)}
              >
                <Plus size={16} aria-hidden="true" />
                {frase}
              </button>
            ))}
          </div>

          {mensaje && <p className="mensaje-error" role="alert">{mensaje}</p>}

          <div className="reportar-enviar">
            <button type="submit" disabled={enviando} className="boton-enviar">
              {enviando ? 'Enviando...' : 'Enviar reporte'}
              <span className="enviar-circulo"><Send size={18} aria-hidden="true" /></span>
            </button>
            <p className="ayuda-campo ayuda-centrada ayuda-icono">
              <ShieldCheck size={18} aria-hidden="true" />
              Te avisamos acá cuando la Municipalidad lo reciba y cuando lo resuelva.
            </p>
          </div>
        </section>
      </form>

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} />
    </div>
  );
}

export default ReportarPage;
