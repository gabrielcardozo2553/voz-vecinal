import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, IdCard, Eye, EyeOff, ShieldCheck, LogIn, UserPlus } from 'lucide-react';
import '../styles/pages/LoginPage.css';

function LoginPage() {
  const [modo, setModo] = useState('login'); 
  const [formData, setFormData] = useState({ nombre: '', apellido: '', dni: '', email: '', password: '' });
  const [aceptaTerminos, setAceptaTerminos] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [mensajeExito, setMensajeExito] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    const valorLimpio = name === 'dni' ? value.replace(/\D/g, '') : value;
    setFormData({ ...formData, [name]: valorLimpio });
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setMensaje('');
    setMensajeExito(false);
    setVerPassword(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setMensajeExito(false);

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
        setMensajeExito(true);
        setFormData({ ...formData, password: '' });
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

  const esRegistro = modo === 'registro';

  return (
    <div className="login-page">
      <div className="login-hero">
        <svg className="login-dibujo" width="92" height="72" viewBox="0 0 92 72" aria-hidden="true">
          <g stroke="#f2b134" strokeWidth="3" strokeLinecap="round" fill="none"><path d="M46 13v7" transform="rotate(-75 46 46)" /><path d="M46 13v7" transform="rotate(-50 46 46)" /><path d="M46 13v7" transform="rotate(-25 46 46)" /><path d="M46 13v7" transform="rotate(25 46 46)" /><path d="M46 13v7" transform="rotate(50 46 46)" /><path d="M46 13v7" transform="rotate(75 46 46)" /></g>
          <path d="M22 46A24 24 0 0 1 70 46Z" fill="#f2b134" />
          <rect x="44" y="14" width="4" height="34" fill="#0b3f4a" />
          <rect x="39" y="20" width="14" height="3" fill="#0b3f4a" />
          <rect x="35" y="29" width="22" height="4" fill="#0b3f4a" />
          <path d="M4 54q7-4 14 0t14 0t14 0t14 0t14 0t14 0" stroke="#0d5c6b" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M14 63q7-4 14 0t14 0t14 0t14 0" stroke="#7fb4bd" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
        <h2>{esRegistro ? 'Creá tu cuenta' : 'Bienvenido a Voz Vecinal'}</h2>
        <p className="login-subtitulo">
          {esRegistro
            ? 'Con tu cuenta podés reportar problemas y seguir cómo avanzan.'
            : 'Entrá para reportar un problema y ver cómo avanza.'}
        </p>
      </div>

      <div className="login-tarjeta">
        <div className="login-tabs" role="group" aria-label="Elegir entre ingresar o registrarse">
          <button
            type="button"
            className={`login-tab ${!esRegistro ? 'activo' : ''}`}
            aria-pressed={!esRegistro}
            onClick={() => cambiarModo('login')}
          >
            <LogIn size={18} aria-hidden="true" />
            Ingresar
          </button>
          <button
            type="button"
            className={`login-tab ${esRegistro ? 'activo' : ''}`}
            aria-pressed={esRegistro}
            onClick={() => cambiarModo('registro')}
          >
            <UserPlus size={18} aria-hidden="true" />
            Registrarme
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {esRegistro && (
            <>
              <div className="campo-fila">
                <div className="campo">
                  <label htmlFor="nombre">Nombre</label>
                  <div className="input-icono">
                    <User size={20} aria-hidden="true" />
                    <input id="nombre" type="text" name="nombre" autoComplete="given-name" value={formData.nombre} onChange={handleChange} required />
                  </div>
                </div>
                <div className="campo">
                  <label htmlFor="apellido">Apellido</label>
                  <div className="input-icono">
                    <User size={20} aria-hidden="true" />
                    <input id="apellido" type="text" name="apellido" autoComplete="family-name" value={formData.apellido} onChange={handleChange} required />
                  </div>
                </div>
              </div>

              <div className="campo">
                <label htmlFor="dni">DNI</label>
                <div className="input-icono">
                  <IdCard size={20} aria-hidden="true" />
                  <input
                    id="dni"
                    type="text"
                    name="dni"
                    value={formData.dni}
                    onChange={handleChange}
                    inputMode="numeric"
                    maxLength={8}
                    placeholder="Sin puntos, solo números"
                    aria-describedby="dni-ayuda"
                    required
                  />
                </div>
                <p className="campo-ayuda" id="dni-ayuda">
                  Lo pedimos para que cada reporte tenga un responsable y se tome en serio.
                </p>
              </div>
            </>
          )}

          <div className="campo">
            <label htmlFor="email">Email</label>
            <div className="input-icono">
              <Mail size={20} aria-hidden="true" />
              <input id="email" type="email" name="email" autoComplete="email" value={formData.email} onChange={handleChange} required />
            </div>
          </div>

          <div className="campo">
            <label htmlFor="password">Contraseña</label>
            <div className="input-icono">
              <Lock size={20} aria-hidden="true" />
              <input
                id="password"
                type={verPassword ? 'text' : 'password'}
                name="password"
                autoComplete={esRegistro ? 'new-password' : 'current-password'}
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="boton-ver-password"
                onClick={() => setVerPassword(!verPassword)}
                aria-label={verPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={verPassword}
              >
                {verPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {esRegistro && (
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

          {mensaje && (
            <p
              className={mensajeExito ? 'login-mensaje login-mensaje-exito' : 'login-mensaje login-mensaje-error'}
              role={mensajeExito ? 'status' : 'alert'}
            >
              {mensaje}
            </p>
          )}

          <button type="submit" className="login-enviar" disabled={enviando}>
            {enviando ? 'Enviando...' : esRegistro ? 'Crear mi cuenta' : 'Ingresar'}
          </button>
        </form>

        {esRegistro && (
          <p className="login-privacidad">
            <ShieldCheck size={18} aria-hidden="true" />
            Tus datos los ve solo el personal municipal autorizado.
          </p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
