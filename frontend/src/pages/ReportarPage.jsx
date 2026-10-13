import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../styles/pages/ReportarPage.css';
import { useAuth } from '../context/AuthContext';
import { Send, Check, CheckCircle, LocateFixed, Camera, ImageIcon, X } from 'lucide-react';
import { iconoCategoria } from '../utils/categorias';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import SelectorUbicacion from '../components/SelectorUbicacion';

const TAMANO_MAXIMO_MB = 5;

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
    setFormData({ ...formData, descripcion: nueva });
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

  const handleFotoChange = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) return;

    const tamanoMB = archivo.size / (1024 * 1024);
    if (tamanoMB > TAMANO_MAXIMO_MB) {
      setMensaje(`La foto pesa ${tamanoMB.toFixed(1)}MB. El máximo permitido es ${TAMANO_MAXIMO_MB}MB — probá con otra foto o sacale una nueva con menor calidad.`);
      e.target.value = '';
      return;
    }

    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(archivo);
    setFotoPreview(URL.createObjectURL(archivo));
    setMensaje('');
  };

  const handleQuitarFoto = () => {
    if (fotoPreview) URL.revokeObjectURL(fotoPreview);
    setFoto(null);
    setFotoPreview(null);
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
      <h2>¿Qué pasa en tu barrio?</h2>
      <p className="reportar-subtitulo">Son tres pasos y tu reporte le llega directo a la Municipalidad.</p>
      <form onSubmit={handleSubmit}>

        <section className="reportar-paso">
          <div className="paso-titulo">
            <span className="paso-numero">1</span>
            <h3>¿Qué tipo de problema es?</h3>
          </div>
          <div className="categoria-grid">
            {categorias.map(cat => {
              const Icono = iconoCategoria(cat.nombre);
              const estaSeleccionada = formData.categoria_id === cat.id;
              return (
                <button
                  type="button"
                  key={cat.id}
                  className={`categoria-boton ${estaSeleccionada ? 'seleccionada' : ''}`}
                  aria-pressed={estaSeleccionada}
                  onClick={() => handleCategoriaClick(cat.id)}
                >
                  <Icono className="categoria-icono" size={26} strokeWidth={1.8} aria-hidden="true" />
                  <span className="categoria-nombre">{cat.nombre}</span>
                  {estaSeleccionada && <Check className="check-icono" size={18} strokeWidth={2.6} aria-hidden="true" />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="reportar-paso">
          <div className="paso-titulo">
            <span className="paso-numero">2</span>
            <h3>¿Dónde está?</h3>
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
          </div>
          <p className="ayuda-campo">Si querés, tocá el mapa para marcar el punto exacto.</p>
          <div className="campo">
            <label htmlFor="direccion">Dirección o referencia</label>
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
        </section>

        <section className="reportar-paso">
          <div className="paso-titulo">
            <span className="paso-numero">3</span>
            <h3>Sumá una foto y contanos</h3>
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

          <div className="campo">
            <label htmlFor="descripcion">Descripción</label>
            <textarea
              id="descripcion"
              name="descripcion"
              value={formData.descripcion}
              onChange={handleChange}
              placeholder="Contá qué viste y desde cuándo pasa"
              required
            />
          </div>
          <div className="frases-rapidas">
            {FRASES_RAPIDAS.map(frase => (
              <button
                type="button"
                key={frase}
                className="frase-rapida"
                onClick={() => handleFraseRapida(frase)}
              >
                {frase}
              </button>
            ))}
          </div>
        </section>

        {mensaje && <p className="mensaje-error" role="alert">{mensaje}</p>}

        <div className="reportar-enviar">
          <button type="submit" disabled={enviando} className="boton-enviar">
            <Send size={20} aria-hidden="true" />
            {enviando ? 'Enviando...' : 'Enviar reporte'}
          </button>
          <p className="ayuda-campo ayuda-centrada">
            Te avisamos acá cuando la Municipalidad lo reciba y cuando lo resuelva.
          </p>
        </div>
      </form>

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} />
    </div>
  );
}

export default ReportarPage;
