import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import ReportarPage from './pages/ReportarPage';
import MisReportesPage from './pages/MisReportesPage';
import VerReportesPage from './pages/VerReportesPage';
import AdminPage from './pages/AdminPage';
import LoginPage from './pages/LoginPage';
import RutaProtegida from './components/RutaProtegida';
import BottomNav from './components/layout/BottomNav';

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<ReportarPage />} />
        <Route path="/reportes" element={<VerReportesPage />} />
        <Route path="/mis-reportes" element={<RutaProtegida><MisReportesPage /></RutaProtegida>} />
        <Route path="/admin" element={<RutaProtegida soloAdmin={true}><AdminPage /></RutaProtegida>} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Footer />
      <BottomNav />
    </BrowserRouter>
  );
}

export default App;