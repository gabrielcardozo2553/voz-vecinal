const LADO_MAXIMO = 1600;
const CALIDAD = 0.8;

function cargarImagen(archivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(archivo);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo leer la imagen'));
    };
    img.src = url;
  });
}

export async function comprimirImagen(archivo) {
  const img = await cargarImagen(archivo);
  const escala = Math.min(1, LADO_MAXIMO / Math.max(img.naturalWidth, img.naturalHeight));
  const ancho = Math.round(img.naturalWidth * escala);
  const alto = Math.round(img.naturalHeight * escala);

  const canvas = document.createElement('canvas');
  canvas.width = ancho;
  canvas.height = alto;
  canvas.getContext('2d').drawImage(img, 0, 0, ancho, alto);

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', CALIDAD));
  if (!blob) throw new Error('No se pudo comprimir la imagen');

  const nombre = archivo.name.replace(/\.[^.]+$/, '') || 'foto';
  return new File([blob], `${nombre}.jpg`, { type: 'image/jpeg', lastModified: Date.now() });
}
