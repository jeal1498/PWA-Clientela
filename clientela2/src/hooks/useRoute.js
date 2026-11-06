// Calcula km y minutos entre dos lugares (y paradas intermedias) cuando origen y destino están elegidos.
import { useEffect, useState } from 'react';
import { route } from '../lib/maps.js';

export function useRoute(from, to, via = []) {
  const [state, setState] = useState({ km: 0, min: 0, loading: false, estimated: false });
  const viaKey = via.map((p) => `${p.lat},${p.lon}`).join(';'); // el arreglo es nuevo en cada render: se compara por contenido
  useEffect(() => {
    if (!from || !to) return setState({ km: 0, min: 0, loading: false, estimated: false });
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    route(from, to, via).then((r) => live && setState({ ...r, loading: false }));
    return () => { live = false; };
  }, [from, to, viaKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return state;
}
