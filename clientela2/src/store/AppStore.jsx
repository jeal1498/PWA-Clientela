// Estado global persistente (localStorage `clientela2`).
//  config   → costos, tarifas, Wi-Fi, SOS (Módulo A)
//  history  → cotizaciones guardadas
//  clients  → clientes frecuentes (CRM)
//  trips    → bitácora de viajes realizados
//  expenses → gastos del turno
//  places   → lugares guardados {name, label, sub, lat, lon} (Casa, Trabajo, Escuela…)
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_CONFIG, withDefaults } from '../lib/pricing.js';
import { load, save, importFromCartera, KEY } from '../lib/storage.js';
import { missingCopies } from '../lib/series.js';
import { today } from '../lib/dates.js';
import { aplicarOps } from '../lib/nube-sync.js';

const Store = createContext(null);
export const COLLECTIONS = ['history', 'clients', 'trips', 'expenses', 'places'];
const LIMIT = 2000; // tope por colección para no llenar el localStorage

const newId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function initial() {
  const s = load();
  const base = Object.fromEntries(COLLECTIONS.map((c) => [c, s[c] || []]));
  // published: el último enlace público que el conductor «guardó» (para avisar si su enlace ya no está al día).
  const published = s.published || null;
  if (s.config) return { config: withDefaults(s.config), ...base, published };
  const imported = importFromCartera();
  return { config: withDefaults({ driver: { ...DEFAULT_CONFIG.driver, ...(imported || {}) } }), ...base, published };
}

export function AppStoreProvider({ children }) {
  const [state, setState] = useState(initial);
  const written = useRef('');
  const latest = useRef(state);
  latest.current = state;
  useEffect(() => { written.current = JSON.stringify(state); save(state); }, [state]);

  // Viajes frecuentes: agenda solos los que falten (al abrir, al cambiar los viajes y al volver a la app).
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const on = () => document.visibilityState === 'visible' && setTick((n) => n + 1);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  useEffect(() => {
    const extra = missingCopies(state.trips, today());
    if (extra.length) setState((s) => ({ ...s, trips: [...extra, ...s.trips].slice(0, LIMIT) }));
  }, [state.trips, tick]);

  // Tiempo real entre pestañas: si el panel cambia algo, la vista pública abierta en otra pestaña se actualiza.
  // (Se ignora el eco de lo que esta misma pestaña acaba de escribir para no entrar en bucle.)
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== KEY || !e.newValue || e.newValue === written.current) return;
      try {
        const s = JSON.parse(e.newValue);
        setState((cur) => ({ ...cur, ...s, config: withDefaults(s.config || {}) }));
      } catch { /* dato corrupto: se ignora */ }
    };
    addEventListener('storage', onStorage);
    return () => removeEventListener('storage', onStorage);
  }, []);

  /** Actualiza una sección de la configuración: setSection('costs', { gasPrice: 25 }) */
  const setSection = useCallback((section, patch) => {
    setState((s) => ({ ...s, config: { ...s.config, [section]: { ...s.config[section], ...patch } } }));
  }, []);

  // Costos y tarifas a valores sugeridos (no toca la página pública ni tus datos).
  const resetConfig = useCallback(() => setState((s) => ({ ...s, config: withDefaults({ driver: s.config.driver, wifi: s.config.wifi, sos: s.config.sos, vehicle: s.config.vehicle, page: s.config.page }) })), []);

  // Página pública a valores predeterminados (estado, servicios, amenidades, pagos, políticas, redes y vehículo).
  // Conserva nombre, foto, WhatsApp, Wi-Fi, costos y tarifas.
  const resetPublic = useCallback(() => setState((s) => ({ ...s, config: { ...s.config, page: withDefaults({}).page, vehicle: withDefaults({}).vehicle } })), []);

  /** Marca el enlace actual como publicado (botón «Guardar cambios»). */
  const markPublished = useCallback((code) => setState((s) => ({ ...s, published: { code, at: new Date().toISOString() } })), []);

  // CRUD genérico para las colecciones. Lo más nuevo va primero.
  const add = useCallback((coll, item) => {
    const full = { id: newId(), createdAt: new Date().toISOString(), updatedAt: Date.now(), ...item };
    setState((s) => ({ ...s, [coll]: [full, ...s[coll]].slice(0, LIMIT) }));
    return full;
  }, []);
  const update = useCallback((coll, id, patch) => {
    setState((s) => ({ ...s, [coll]: s[coll].map((x) => (x.id === id ? { ...x, ...patch, updatedAt: Date.now() } : x)) }));
  }, []);
  const remove = useCallback((coll, id) => setState((s) => ({ ...s, [coll]: s[coll].filter((x) => x.id !== id) })), []);

  // Nube: datos vivos para sincronizar y aplicación de lo que trajo la nube (sobre el estado actual, sin pisar cambios recientes).
  const snapshot = useCallback(() => latest.current, []);
  const applyRemote = useCallback(({ config, ops }) => {
    setState((s) => {
      const n = { ...s };
      if (config) n.config = withDefaults(config);
      for (const c of COLLECTIONS) if (ops?.[c]) n[c] = aplicarOps(s[c], ops[c]);
      return n;
    });
  }, []);

  const value = useMemo(() => ({
    ...state,
    snapshot,
    applyRemote,
    setSection,
    resetConfig,
    resetPublic,
    markPublished,
    add,
    update,
    remove,
    // Atajos usados por las pantallas de la fase 1.
    addQuote: (q) => add('history', { status: 'pendiente', ...q }),
    updateQuote: (id, p) => update('history', id, p),
    removeQuote: (id) => remove('history', id),
  }), [state, snapshot, applyRemote, setSection, resetConfig, resetPublic, markPublished, add, update, remove]);

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
