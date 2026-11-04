// Calcula km y minutos entre dos lugares cuando ambos están elegidos.
import { useEffect, useState } from 'react';
import { route } from '../lib/maps.js';

export function useRoute(from, to) {
  const [state, setState] = useState({ km: 0, min: 0, loading: false, estimated: false });
  useEffect(() => {
    if (!from || !to) return setState({ km: 0, min: 0, loading: false, estimated: false });
    let live = true;
    setState((s) => ({ ...s, loading: true }));
    route(from, to).then((r) => live && setState({ ...r, loading: false }));
    return () => { live = false; };
  }, [from, to]);
  return state;
}
