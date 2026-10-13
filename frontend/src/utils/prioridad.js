const DIA = 86400000;

function pesoCategoria(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('agua') || n.includes('cloaca') || n.includes('inundac')) return 3;
  if (n.includes('transito') || n.includes('tránsito') || n.includes('señal')) return 3;
  if (n.includes('bache') || n.includes('alumbrado') || n.includes('luz') || n.includes('animal')) return 2;
  return 1;
}

function pesoAntiguedad(dias) {
  if (dias >= 14) return 3;
  if (dias >= 7) return 2;
  if (dias >= 3) return 1;
  return 0;
}

export const PRIORIDAD_TEXTO = { alta: 'Alta', media: 'Media', baja: 'Baja' };
export const PRIORIDAD_ORDEN = { alta: 0, media: 1, baja: 2 };

export function prioridadDe(reporte) {
  if (reporte.estado === 'resuelto') return null;
  const dias = Math.max(0, Math.floor((Date.now() - new Date(reporte.fecha_creacion).getTime()) / DIA));
  const puntos = pesoCategoria(reporte.categoria) + pesoAntiguedad(dias);
  if (puntos >= 4) return 'alta';
  if (puntos === 3) return 'media';
  return 'baja';
}

export function tiempoMedioDeRespuesta(reportes) {
  const duraciones = reportes
    .filter((r) => r.estado === 'resuelto' && r.fecha_resolucion)
    .map((r) => new Date(r.fecha_resolucion) - new Date(r.fecha_creacion))
    .filter((ms) => ms >= 0);

  if (duraciones.length === 0) return null;

  const dias = duraciones.reduce((suma, ms) => suma + ms, 0) / duraciones.length / DIA;
  return { dias, cantidad: duraciones.length };
}

export function textoDuracion(dias) {
  if (dias < 1) {
    const horas = Math.max(1, Math.round(dias * 24));
    return horas === 1 ? '1 hora' : `${horas} horas`;
  }
  const redondeado = Math.round(dias * 10) / 10;
  const texto = Number.isInteger(redondeado) ? String(redondeado) : redondeado.toLocaleString('es-AR');
  return redondeado === 1 ? '1 día' : `${texto} días`;
}
