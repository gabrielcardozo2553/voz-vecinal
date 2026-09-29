import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Home, List, ClipboardList, ShieldCheck, LogIn } from 'lucide-react';
import '../../styles/components/layout/BottomNav.css';

function BottomNav() {
  const { usuario } = useAuth();

  return (
    <nav className="bottom-nav">
      <NavLink to="/" end className="bottom-nav-link">
        <Home size={20} />
        <span>Reportar</span>
      </NavLink>

      <NavLink to="/reportes" className="bottom-nav-link">
        <List size={20} />
        <span>Ver reportes</span>
      </NavLink>

      {usuario && (
        <NavLink to="/mis-reportes" className="bottom-nav-link">
          <ClipboardList size={20} />
          <span>Mis reportes</span>
        </NavLink>
      )}

      {usuario?.rol === 'admin' && (
        <NavLink to="/admin" className="bottom-nav-link">
          <ShieldCheck size={20} />
          <span>Admin</span>
        </NavLink>
      )}

      {!usuario && (
        <NavLink to="/login" className="bottom-nav-link">
          <LogIn size={20} />
          <span>Ingresar</span>
        </NavLink>
      )}
    </nav>
  );
}

export default BottomNav;