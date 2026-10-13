import '../styles/components/Spinner.css';

function Spinner({ texto }) {
  return (
    <div className="spinner-contenedor" role="status" aria-live="polite">
      <div className="spinner" aria-hidden="true"></div>
      <p>{texto || 'Cargando...'}</p>
    </div>
  );
}

export default Spinner;
