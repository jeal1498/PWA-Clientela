// Aviso breve en pantalla («Copiado», «Guardado»…).
import { useCallback, useRef, useState } from 'react';

export function useToast() {
  const [msg, setMsg] = useState('');
  const t = useRef();
  const show = useCallback((m) => {
    setMsg(m);
    clearTimeout(t.current);
    t.current = setTimeout(() => setMsg(''), 1800);
  }, []);
  const node = msg ? (
    <div role="status" className="fixed inset-x-0 bottom-24 z-50 mx-auto w-fit rounded-full bg-hueso px-4 py-2 text-sm font-semibold text-asfalto shadow-xl">{msg}</div>
  ) : null;
  return [node, show];
}
