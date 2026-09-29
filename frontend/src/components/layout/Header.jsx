import { Link, useNavigate } from 'react-router-dom';
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

  return (
    <header className="header">
      <Link to="/" className="header-marca">
        <Logo />
        <div className="header-marca-texto">
          <h1>{NOMBRE_APP}</h1>
          <span>{LOCALIDAD}</span>
        </div>
      </Link>
      <Nav />
      <div className="usuario-info">
        {usuario ? (
          <>
            <span>Hola, {usuario.nombre}</span>
            <button onClick={handleLogout}>Cerrar sesión</button>
          </>
        ) : (
          <span className="usuario-info-vacio"></span>
        )}
      </div>
    </header>
  );
}

export default Header;