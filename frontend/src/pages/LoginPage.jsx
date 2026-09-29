import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/LoginPage.css';

function LoginPage() {
  const [modo, setModo] = useState('login'); 
  const [formData, setFormData] = useState({ nombre: '', apellido: '', dni: '', email: '', password: '' });
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setMensaje('');

    try {
      if (modo === 'registro') {
        await axios.post('http://localhost:3000/api/auth/registro', formData);
        setMensaje('¡Registro exitoso! Ahora podés iniciar sesión.');
        setModo('login');
      } else {
        const res = await axios.post('http://localhost:3000/api/auth/login', {
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
              placeholder="Sin puntos, solo números"
              required
            />
          </>
        )}

        <label>Email:</label>
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />

        <label>Contraseña:</label>
        <input type="password" name="password" value={formData.password} onChange={handleChange} required />

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