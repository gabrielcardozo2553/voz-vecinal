import { CheckCircle, XCircle } from 'lucide-react';
import '../styles/components/Toast.css';

function Toast({ mensaje, tipo }) {
  if (!mensaje) return null;

  return (
    <div className={`toast toast-${tipo}`}>
      {tipo === 'exito' ? <CheckCircle size={18} /> : <XCircle size={18} />}
      <span>{mensaje}</span>
    </div>
  );
}

export default Toast;