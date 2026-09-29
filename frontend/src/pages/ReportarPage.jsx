import { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/pages/ReportarPage.css';
import { useAuth } from '../context/AuthContext';
import { Send, Check } from 'lucide-react';
import { iconoCategoria, colorCategoria } from '../utils/categorias';
import Toast from '../components/Toast';
import { useToast } from '../hooks/useToast';
import SelectorUbicacion from '../components/SelectorUbicacion';

const TAMANO_MAXIMO_MB = 5;

function ReportarPage() {
  const { usuario } = useAuth();
  const { toast, mostrarToast } = useToast();
  const [categorias, setCategorias] = useState([]);
  const [formData, setFormData] = useState({
    categoria_id: '',
    descripcion: '',
    direccion: '',
  });

  const [ubicacion, setUbicacion] = useState({ lat: null, lng: null });
  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/api/categorias')
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

  const handleFotoChange = (e) => {
    const archivo = e.target.files[0];

    if (!archivo) return;

    const tamanoMB = archivo.size / (1024 * 1024);
    if (tamanoMB > TAMANO_MAXIMO_MB) {
      setMensaje(`La foto pesa ${tamanoMB.toFixed(1)}MB. El máximo permitido es ${TAMANO_MAXIMO_MB}MB — probá con otra foto o sacale una nueva con menor calidad.`);
      e.target.value = '';
      return;
    }

    setFoto(archivo);
    setFotoPreview(URL.createObjectURL(archivo));
    setMensaje('');
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
      await axios.post('http://localhost:3000/api/reportes', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      setMensaje('¡Reporte enviado correctamente!');
      setFormData({ categoria_id: '', descripcion: '', direccion: '' });
      setUbicacion({ lat: null, lng: null });
      setFoto(null);
      setFotoPreview(null);
    } catch (error) {
      console.error(error);
      mostrarToast('Hubo un error al enviar el reporte. Probá de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="reportar-page">
      <h2>Reportar un problema</h2>
      <p className="reportar-subtitulo">Contanos qué sucede en tu barrio. Tu reporte ayuda a mejorar nuestra comunidad.</p>
      <form onSubmit={handleSubmit}>
        <label>Categoría:</label>
        <div className="categoria-grid">
          {categorias.map(cat => {
            const Icono = iconoCategoria(cat.nombre);
            const color = colorCategoria(cat.nombre);
            const estaSeleccionada = formData.categoria_id === cat.id;
            return (
              <button
                type="button"
                key={cat.id}
                className={`categoria-boton ${color} ${estaSeleccionada ? 'seleccionada' : ''}`}
                onClick={() => handleCategoriaClick(cat.id)}
              >
                {estaSeleccionada && <Check className="check-icono" size={14} strokeWidth={3} />}
                <Icono className="categoria-icono" size={24} strokeWidth={1.8} />
                <span className="categoria-nombre">{cat.nombre}</span>
              </button>
            );
          })}
        </div>

        <label>Descripción:</label>
        <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} required />

        <label>Dirección / Ubicación:</label>
        <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} required />

        <label>Marcá el punto exacto en el mapa (opcional):</label>
        <SelectorUbicacion
          latitud={ubicacion.lat}
          longitud={ubicacion.lng}
          onSeleccionar={(lat, lng) => setUbicacion({ lat, lng })}
        />

        <label>Foto:</label>
        <label className="foto-dropzone">
          {fotoPreview ? (
            <img src={fotoPreview} alt="Vista previa" className="foto-preview" />
          ) : (
            <span>📷 Tocá para sacar o elegir una foto</span>
          )}
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFotoChange}
            hidden
          />
        </label>

        <button type="submit" disabled={enviando} className="boton-enviar">
          <Send size={18} />
          {enviando ? 'Enviando...' : 'Enviar reporte'}
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}

      <Toast mensaje={toast.mensaje} tipo={toast.tipo} />
    </div>
  );
}

export default ReportarPage;