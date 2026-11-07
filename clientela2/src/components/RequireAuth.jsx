// Protege la app del conductor (/app): sin sesión pide entrar con Google. La página pública (#/?c=…) no pasa por aquí.
// Con sesión sincroniza al abrir, al volver la conexión, al volver a la app y unos segundos después de cada cambio.
import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../store/AppStore.jsx';
import { useSesion } from '../hooks/useNube.js';
import { sincronizar, programar } from '../lib/nube.js';
import Acceso from './Acceso.jsx';

function NubeSync() {
  const { snapshot, applyRemote, config, history, clients, trips, expenses, places } = useStore();
  const sync = useCallback(() => sincronizar(snapshot, applyRemote).catch(() => {}), [snapshot, applyRemote]);

  useEffect(() => {
    sync();
    const visible = () => { if (document.visibilityState === 'visible') sync(); };
    addEventListener('online', sync);
    document.addEventListener('visibilitychange', visible);
    return () => { removeEventListener('online', sync); document.removeEventListener('visibilitychange', visible); };
  }, [sync]);

  useEffect(() => { programar(snapshot, applyRemote); }, [snapshot, applyRemote, config, history, clients, trips, expenses, places]);
  return null;
}

export default function RequireAuth({ children }) {
  const hay = useSesion();
  const [listo, setListo] = useState(hay); // «listo»: ya pasó por el acceso (y la subida de la primera vez)
  useEffect(() => { if (!hay) setListo(false); }, [hay]);
  const terminar = useCallback(() => setListo(true), []);
  if (!hay || !listo) return <Acceso onListo={terminar} />;
  return (
    <>
      <NubeSync />
      {children}
    </>
  );
}
