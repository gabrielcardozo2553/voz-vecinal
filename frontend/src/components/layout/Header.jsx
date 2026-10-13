import { Link, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import Nav from './Nav';
import Logo from '../Logo';
import { useAuth } from '../../context/AuthContext';
import { NOMBRE_APP, LOCALIDAD } from '../../config';
import '../../styles/components/layout/Header.css';

function Header() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const inicial = usuario?.nombre ? usuario.nombre.trim().charAt(0).toUpperCase() : '';

  return (
    <header className="header">
      <Link to="/" className="header-marca">
        <span className="header-logo">
          <Logo />
        </span>
        <div className="header-marca-texto">
          <h1>{NOMBRE_APP}</h1>
          <span>{LOCALIDAD}</span>
        </div>
      </Link>
      <Nav />
      <div className="usuario-info">
        {usuario ? (
          <>
            <span className="usuario-avatar" aria-hidden="true">{inicial}</span>
            <span className="usuario-saludo">Hola, {usuario.nombre}</span>
            <button type="button" onClick={handleLogout} aria-label="Cerrar sesión">
              <LogOut size={18} aria-hidden="true" />
              <span className="usuario-salir-texto">Cerrar sesión</span>
            </button>
          </>
        ) : (
          <span className="usuario-info-vacio"></span>
        )}
      </div>
    </header>
  );
}

export default Header;
