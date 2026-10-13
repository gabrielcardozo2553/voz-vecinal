import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CirclePlus, Map as MapaIcono, ClipboardList, ShieldCheck, LogIn } from 'lucide-react';
import '../../styles/components/layout/BottomNav.css';

function BottomNav() {
  const { usuario } = useAuth();

  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      <NavLink to="/" end className="bottom-nav-link">
        <CirclePlus size={24} aria-hidden="true" />
        <span>Reportar</span>
      </NavLink>

      <NavLink to="/reportes" className="bottom-nav-link">
        <MapaIcono size={24} aria-hidden="true" />
        <span>Ver reportes</span>
      </NavLink>

      {usuario && (
        <NavLink to="/mis-reportes" className="bottom-nav-link">
          <ClipboardList size={24} aria-hidden="true" />
          <span>Mis reportes</span>
        </NavLink>
      )}

      {usuario?.rol === 'admin' && (
        <NavLink to="/admin" className="bottom-nav-link">
          <ShieldCheck size={24} aria-hidden="true" />
          <span>Admin</span>
        </NavLink>
      )}

      {!usuario && (
        <NavLink to="/login" className="bottom-nav-link">
          <LogIn size={24} aria-hidden="true" />
          <span>Ingresar</span>
        </NavLink>
      )}
    </nav>
  );
}

export default BottomNav;
