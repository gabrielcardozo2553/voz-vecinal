import { useAuth } from '../context/AuthContext';

function RutaProtegida({ children, soloAdmin = false }) {
  const { usuario } = useAuth();

  if (!usuario) {
    return <p>Tenés que <a href="/login">iniciar sesión</a> para ver esta página.</p>;
  }

  if (soloAdmin && usuario.rol !== 'admin') {
    return <p>No tenés permisos para ver esta página.</p>;
  }

  return children;
}

export default RutaProtegida;