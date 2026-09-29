import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/components/layout/Nav.css';

function Nav() {
  const { usuario } = useAuth();

  return (
    <nav className="nav">
      <NavLink to="/">Reportar</NavLink>
      <NavLink to="/reportes">Ver reportes</NavLink>
      {usuario && <NavLink to="/mis-reportes">Mis reportes</NavLink>}
      {usuario?.rol === 'admin' && <NavLink to="/admin">Panel admin</NavLink>}
      {!usuario && <NavLink to="/login">Ingresar</NavLink>}
    </nav>
  );
}

export default Nav;