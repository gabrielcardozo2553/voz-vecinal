import { CheckCircle, XCircle } from 'lucide-react';
import '../styles/components/Toast.css';

function Toast({ mensaje, tipo }) {
  if (!mensaje) return null;

  return (
    <div className={`toast toast-${tipo}`} role={tipo === 'exito' ? 'status' : 'alert'}>
      {tipo === 'exito'
        ? <CheckCircle size={22} aria-hidden="true" />
        : <XCircle size={22} aria-hidden="true" />}
      <span>{mensaje}</span>
    </div>
  );
}

export default Toast;
