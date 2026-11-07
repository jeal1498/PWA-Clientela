// Pantalla de acceso con Google (obligatoria para usar la app) y de «Subiendo tus datos» la primera vez.
import { useEffect, useRef, useState } from 'react';
import { useStore, COLLECTIONS } from '../store/AppStore.jsx';
import { pintarBotonGoogle, sincronizar } from '../lib/nube.js';

function Logo() {
  return <img src="../marca/icono-app.svg" alt="" className="size-20 rounded-3xl" />;
}

export default function Acceso({ onListo }) {
  const { snapshot, applyRemote } = useStore();
  const [fase, setFase] = useState('pedir'); // pedir | subiendo
  const [cuentas, setCuentas] = useState({ clients: 0, trips: 0 });
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  const btn = useRef(null);

  useEffect(() => {
    if (fase !== 'pedir' || !btn.current) return;
    let vivo = true;
    pintarBotonGoogle(btn.current, {
      onEntro: async () => {
        const d = snapshot();
        const hay = COLLECTIONS.some((c) => d[c]?.length) || !!d.config?.driver?.name;
        if (hay) { setCuentas({ clients: d.clients.length, trips: d.trips.length }); setFase('subiendo'); }
        try { await sincronizar(snapshot, applyRemote); } catch { /* sin internet: se sube después */ }
        onListo();
      },
      onError: (m) => vivo && setError(m),
    }).catch(() => vivo && setError(navigator.onLine === false ? 'Sin conexión. Conéctate a internet para entrar la primera vez.' : 'No se pudo cargar el acceso de Google.'));
    return () => { vivo = false; };
  }, [fase, intento, snapshot, applyRemote, onListo]);

  if (fase === 'subiendo') {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo />
        <h1 className="font-titulo text-3xl leading-tight">Subiendo tus datos</h1>
        <p className="text-gris">Encontré datos en este teléfono. Los paso a tu cuenta para no perderlos.</p>
        <div className="grid w-full grid-cols-2 gap-2">
          <div className="rounded-3xl bg-tablero p-3"><b className="block font-titulo text-3xl">{cuentas.clients}</b><span className="text-xs text-gris">Clientes</span></div>
          <div className="rounded-3xl bg-tablero p-3"><b className="block font-titulo text-3xl">{cuentas.trips}</b><span className="text-xs text-gris">Viajes</span></div>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-humo"><i className="block h-full w-2/3 animate-pulse rounded-full bg-cobrado" /></div>
        <p className="text-xs text-gris">No cierres la app unos segundos.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <Logo />
      <h1 className="font-titulo text-3xl leading-tight">Tus clientes, en orden</h1>
      <p className="text-gris">Entra con la cuenta de Google que usas en Checa.</p>
      <div ref={btn} className="min-h-11" aria-live="polite" />
      {error && (
        <>
          <p role="status" className="rounded-2xl bg-tedebe px-4 py-3 text-sm font-semibold text-[#2B2200]">{error}</p>
          <button type="button" onClick={() => { setError(''); setIntento((n) => n + 1); }} className="h-12 rounded-2xl bg-cobrado px-6 font-semibold text-[#04210F]">Reintentar</button>
        </>
      )}
      <p className="mt-6 text-xs text-gris">Tus datos son solo tuyos. Nadie más los ve.</p>
    </main>
  );
}
