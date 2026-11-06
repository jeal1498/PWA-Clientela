// Aviso breve en pantalla («Copiado», «Guardado»…). Con `onUndo` muestra «Deshacer» y dura más.
import { useCallback, useRef, useState } from 'react';

/** `bottom`: clase de posición (sube el aviso si la pantalla tiene una barra de acciones fija). */
export function useToast(bottom = 'bottom-24') {
  const [t, setT] = useState(null); // { msg, onUndo }
  const timer = useRef();
  const hide = useCallback(() => { clearTimeout(timer.current); setT(null); }, []);
  const show = useCallback((msg, onUndo) => {
    setT({ msg, onUndo });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT(null), onUndo ? 5000 : 1800);
  }, []);
  const node = t ? (
    <div role="status" className={`fixed inset-x-0 ${bottom} z-50 mx-auto flex w-fit items-center gap-3 rounded-full bg-hueso px-4 py-2 text-sm font-semibold text-asfalto shadow-xl`}>
      {t.msg}
      {t.onUndo && <button type="button" onClick={() => { t.onUndo(); hide(); }} className="-mr-2 rounded-full bg-asfalto px-3 py-1.5 text-[13px] text-hueso">Deshacer</button>}
    </div>
  ) : null;
  return [node, show];
}
