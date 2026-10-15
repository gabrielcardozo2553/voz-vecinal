import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { Home, LogIn } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import PantallaEstado from './components/PantallaEstado';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ReportarPage from './pages/ReportarPage';
import MisReportesPage from './pages/MisReportesPage';
import VerReportesPage from './pages/VerReportesPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RutaProtegida from './components/RutaProtegida';
import BottomNav from './components/layout/BottomNav';

function VolverArriba() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [pathname]);

  return null;
}

function ControlDeSesion() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const id = axios.interceptors.response.use(
      (respuesta) => respuesta,
      (error) => {
        if (error.response?.status === 401) {
          logout();
          navigate('/sesion-vencida', { replace: true });
        }
        return Promise.reject(error);
      }
    );
    return () => axios.interceptors.response.eject(id);
  }, [logout, navigate]);

  return null;
}

function App() {
  return (
    <BrowserRouter>
      <ControlDeSesion />
      <VolverArriba />
      <Header />
      <Routes>
        <Route path="/" element={<ReportarPage />} />
        <Route path="/reportes" element={<VerReportesPage />} />
        <Route path="/mis-reportes" element={<RutaProtegida><MisReportesPage /></RutaProtegida>} />
        <Route path="/admin" element={<RutaProtegida soloAdmin={true}><AdminPage /></RutaProtegida>} />
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/sesion-vencida"
          element={
            <PantallaEstado tipo="sesion">
              <Link to="/login" className="pantalla-boton">
                <LogIn size={18} aria-hidden="true" />
                Ingresar de nuevo
              </Link>
            </PantallaEstado>
          }
        />
        <Route
          path="*"
          element={
            <PantallaEstado tipo="noEncontrada">
              <Link to="/" className="pantalla-boton">
                <Home size={18} aria-hidden="true" />
                Ir al inicio
              </Link>
            </PantallaEstado>
          }
        />
      </Routes>
      <Footer />
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;