// Hoja inferior (modal) pensada para el pulgar. Cierra con el fondo, la X o Escape.
// Va en un portal a <body>: dentro de un padre con backdrop-blur, `fixed` quedaría atrapado en ese padre.
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

export default function Sheet({ open, onClose, title, children }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="max-h-[90dvh] w-full max-w-lg overflow-auto rounded-t-3xl border-t border-white/10 bg-tablero p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }} onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center">
          <h2 className="flex-1 font-titulo text-xl">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="grid size-11 place-items-center rounded-xl bg-white/5"><X className="size-5" /></button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
