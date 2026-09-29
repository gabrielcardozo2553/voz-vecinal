import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ mensaje: '', tipo: '' });

  const mostrarToast = (mensaje, tipo = 'exito') => {
    setToast({ mensaje, tipo });
    setTimeout(() => setToast({ mensaje: '', tipo: '' }), 3000);
  };

  return { toast, mostrarToast };
}