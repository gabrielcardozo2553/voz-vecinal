import {
  TrafficCone,
  Lightbulb,
  Trash2,
  Droplet,
  Trees,
  Sprout,
  PawPrint,
  Signpost,
  SprayCan,
  HelpCircle
} from 'lucide-react';

export function iconoCategoria(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('bache')) return TrafficCone;
  if (n.includes('alumbrado') || n.includes('luz')) return Lightbulb;
  if (n.includes('basura') || n.includes('limpieza')) return Trash2;
  if (n.includes('agua') || n.includes('cloaca') || n.includes('inundac')) return Droplet;
  if (n.includes('plaza') || n.includes('parque') || n.includes('espacio')) return Trees;
  if (n.includes('poda') || n.includes('árbol') || n.includes('arbol')) return Sprout;
  if (n.includes('animal')) return PawPrint;
  if (n.includes('transito') || n.includes('tránsito') || n.includes('señal')) return Signpost;
  if (n.includes('vandal')) return SprayCan;
  return HelpCircle;
}

export function colorCategoria(nombre) {
  const n = nombre.toLowerCase();
  if (n.includes('bache')) return 'color-naranja';
  if (n.includes('alumbrado') || n.includes('luz')) return 'color-amarillo';
  if (n.includes('basura') || n.includes('limpieza')) return 'color-verde';
  if (n.includes('agua') || n.includes('cloaca') || n.includes('inundac')) return 'color-celeste';
  if (n.includes('plaza') || n.includes('parque') || n.includes('espacio')) return 'color-verdeagua';
  if (n.includes('poda') || n.includes('árbol') || n.includes('arbol')) return 'color-verdeagua';
  if (n.includes('animal')) return 'color-marron';
  if (n.includes('transito') || n.includes('tránsito') || n.includes('señal')) return 'color-rojo';
  if (n.includes('vandal')) return 'color-violeta';
  return 'color-gris';
}