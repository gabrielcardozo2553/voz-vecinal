import '../../styles/components/layout/Footer.css';
import { NOMBRE_APP, LOCALIDAD } from '../../config';

function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} {LOCALIDAD} — {NOMBRE_APP}</p>
    </footer>
  );
}

export default Footer;