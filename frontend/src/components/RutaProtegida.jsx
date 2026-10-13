import { Link } from 'react-router-dom';
import { LogIn, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PantallaEstado from './PantallaEstado';

function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return (
      <PantallaEstado
        tipo="sesion"
        titulo="Ingresá para continuar"
        texto="Esta página es para vecinos con cuenta. Ingresá o creá la tuya en un minuto."
      >
        <Link to="/login" className="pantalla-boton">
          <LogIn size={18} aria-hidden="true" />
          Ingresar
        </Link>
      </PantallaEstado>
    );
  }

  if (soloAdmin && usuario.rol !== 'admin') {
    return (
      <PantallaEstado tipo="sinAcceso">
        <Link to="/" className="pantalla-boton">
          <Home size={18} aria-hidden="true" />
          Ir al inicio
        </Link>
      </PantallaEstado>
    );
  }

  return children;
}

export default RutaProtegida;
