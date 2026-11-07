// «Tu cuenta» en Ajustes: correo, estado de la nube, sincronizar y cerrar sesión.
import { useState } from 'react';
import { Cloud, RefreshCw, LogOut } from 'lucide-react';
import { Card, CardTitle, Button, Avatar } from './ui.jsx';
import { useStore } from '../store/AppStore.jsx';
import { useNube } from '../hooks/useNube.js';
import { sincronizar, cerrarSesion, olvidarNube } from '../lib/nube.js';
import { KEY } from '../lib/storage.js';

function hace(ts) {
  if (!ts) return 'Aún sin sincronizar';
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return 'Sincronizado hace un momento';
  if (m < 60) return `Sincronizado hace ${m} min`;
  const h = Math.floor(m / 60);
  return h < 24 ? `Sincronizado hace ${h} h` : 'Sincronizado hace más de un día';
}

export default function CuentaCard() {
  const nube = useNube();
  const { snapshot, applyRemote } = useStore();
  const [ocupado, setOcupado] = useState(false);
  const [saliendo, setSaliendo] = useState(false); // '' | 'confirmar' | 'sinsubir'
  const sinRed = nube.error === 'Sin conexión' || (typeof navigator !== 'undefined' && navigator.onLine === false);
  const nombre = nube.ses?.nombre || nube.ses?.email || '';

  const ahora = async () => { setOcupado(true); try { await sincronizar(snapshot, applyRemote); } catch { /* el estado ya dice qué pasó */ } setOcupado(false); };

  // Cerrar sesión sube lo pendiente y borra los datos de este teléfono (quedan en la cuenta): así otra cuenta no los mezcla.
  const salir = async (forzar) => {
    setOcupado(true);
    try { await sincronizar(snapshot, applyRemote); } catch (e) { if (!forzar) { setOcupado(false); setSaliendo('sinsubir'); return; } }
    try { localStorage.removeItem(KEY); localStorage.removeItem('clientela2_lastPay'); } catch { /* sin almacenamiento */ }
    cerrarSesion(); olvidarNube();
    location.reload();
  };

  return (
    <Card>
      <CardTitle icon={Cloud}>Tu cuenta</CardTitle>
      <div className="flex items-center gap-3">
        <Avatar name={nombre} light="green" />
        <div className="min-w-0">
          <b className="block truncate">{nube.ses?.nombre || 'Tu cuenta'}</b>
          <span className="block truncate text-sm text-gris">{nube.ses?.email}</span>
        </div>
      </div>
      {sinRed || nube.error
        ? <p role="status" className="mt-3 rounded-2xl bg-tedebe px-4 py-3 text-sm font-semibold text-[#2B2200]">{sinRed ? 'Sin conexión. Tus cambios se suben cuando haya internet.' : 'No se pudo sincronizar. Intenta de nuevo.'}</p>
        : <p className="mt-3 inline-flex items-center gap-2 font-mono text-xs font-bold text-cobrado"><i className="size-2 rounded-full bg-cobrado" />{hace(nube.ultima)}</p>}
      <div className="mt-3 grid gap-2">
        <Button variant="outline" icon={RefreshCw} disabled={ocupado} onClick={ahora}>{ocupado ? 'Sincronizando…' : sinRed || nube.error ? 'Reintentar' : 'Sincronizar ahora'}</Button>
        {!saliendo && <Button variant="danger" icon={LogOut} disabled={ocupado} onClick={() => setSaliendo('confirmar')}>Cerrar sesión</Button>}
      </div>
      {saliendo && (
        <div className="mt-3 grid gap-2 rounded-2xl bg-asfalto p-3 text-sm">
          <p className="text-gris">{saliendo === 'sinsubir' ? 'Hay cambios que no se pudieron subir. Si cierras ahora, se pierden.' : 'Tus datos se quedan en tu cuenta y se quitan de este teléfono. Al volver a entrar regresan.'}</p>
          <Button variant="danger" disabled={ocupado} onClick={() => salir(saliendo === 'sinsubir')}>{saliendo === 'sinsubir' ? 'Cerrar de todos modos' : 'Sí, cerrar sesión'}</Button>
          <Button variant="ghost" disabled={ocupado} onClick={() => setSaliendo(false)}>Cancelar</Button>
        </div>
      )}
    </Card>
  );
}
