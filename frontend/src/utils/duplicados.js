const RADIO_METROS = 80;

function metrosEntre(a, b) {
  const radioTierra = 6371000;
  const aRad = (grados) => (grados * Math.PI) / 180;
  const dLat = aRad(b.latitud - a.latitud);
  const dLng = aRad(b.longitud - a.longitud);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(aRad(a.latitud)) * Math.cos(aRad(b.latitud)) * Math.sin(dLng / 2) ** 2;
  return 2 * radioTierra * Math.asin(Math.sqrt(h));
}

function tieneUbicacion(r) {
  return Number.isFinite(Number(r.latitud)) && Number.isFinite(Number(r.longitud))
    && r.latitud !== null && r.longitud !== null;
}

export function detectarDuplicados(reportes) {
  const abiertos = reportes
    .filter((r) => r.estado !== 'resuelto' && tieneUbicacion(r))
    .map((r) => ({ ...r, latitud: Number(r.latitud), longitud: Number(r.longitud) }));

  const resultado = new Map();

  abiertos.forEach((a, i) => {
    for (let j = i + 1; j < abiertos.length; j += 1) {
      const b = abiertos[j];
      if (a.categoria !== b.categoria) continue;
      const metros = metrosEntre(a, b);
      if (metros > RADIO_METROS) continue;
      resultado.set(a.id, [...(resultado.get(a.id) || []), { id: b.id, metros }]);
      resultado.set(b.id, [...(resultado.get(b.id) || []), { id: a.id, metros }]);
    }
  });

  return resultado;
}

export function textoDistancia(metros) {
  if (metros < 10) return 'en el mismo lugar';
  return `a ${Math.round(metros / 5) * 5} m`;
}
