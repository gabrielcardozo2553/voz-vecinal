import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/LoginPage.css';

function LoginPage() {
  const [modo, setModo] = useState('login'); 
  const [formData, setFormData] = useState({ nombre: '', apellido: '', dni: '', email: '', password: '' });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const valorLimpio = name === 'dni' ? value.replace(/\D/g, '') : value;
    setFormData({ ...formData, [name]: valorLimpio });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');

    if (modo === 'registro') {
      if (!/^\d{7,8}$/.test(formData.dni)) {
        setMensaje('El DNI debe tener 7 u 8 números, sin puntos.');
        return;
      }
      if (!aceptaTerminos) {
        setMensaje('Tenés que aceptar el uso de tus datos para registrarte.');
        return;
      }
    }

    setEnviando(true);

    try {
      if (modo === 'registro') {
        await axios.post('/api/auth/registro', { ...formData, aceptaTerminos });
        setMensaje('¡Registro exitoso! Ahora podés iniciar sesión.');
        setAceptaTerminos(false);
        setModo('login');
      } else {
        const res = await axios.post('/api/auth/login', {
          email: formData.email,
          password: formData.password
        });
        login(res.data.token, res.data.usuario);
        navigate('/');
      }
    } catch (error) {
      setMensaje(error.response?.data?.error || 'Ocurrió un error');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-page">
      <h2>{modo === 'login' ? 'Iniciar sesión' : 'Registrarse'}</h2>

      <form onSubmit={handleSubmit}>
        {modo === 'registro' && (
          <>
            <label>Nombre:</label>
            <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />

            <label>Apellido:</label>
            <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />

            <label>DNI:</label>
            <input
              type="text"
              name="dni"
              value={formData.dni}
              onChange={handleChange}
              inputMode="numeric"
              maxLength={8}
              placeholder="Sin puntos, solo números"
              required
            />
          </>
        )}

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Contraseña:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />

        {modo === 'registro' && (
          <label className="consentimiento">
            <input
              type="checkbox"
              checked={aceptaTerminos}
              onChange={(e) => setAceptaTerminos(e.target.checked)}
            />
            <span>
              Acepto que mi nombre, apellido y DNI se usen para identificar mis reportes y gestionarlos
              ante la Municipalidad. Solo el personal autorizado puede verlos.
            </span>
          </label>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : modo === 'login' ? 'Iniciar sesión' : 'Registrarse'}
        </button>
      </form>

      {mensaje && <p>{mensaje}</p>}

      <button className="link-boton" onClick={() => setModo(modo === 'login' ? 'registro' : 'login')}>
        {modo === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
      </button>
    </div>
  );
}

export default LoginPage;