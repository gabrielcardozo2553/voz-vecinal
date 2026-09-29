import '../styles/components/Spinner.css';

function Spinner({ texto }) {
  return (
    <div className="spinner-contenedor">
      <div className="spinner"></div>
      {texto && <p>{texto}</p>}
    </div>
  );
}

export default Spinner;