// Estado global persistente (localStorage `clientela2`).
//  config   → costos, tarifas, Wi-Fi, SOS (Módulo A)
//  history  → cotizaciones guardadas
//  clients  → clientes frecuentes (CRM)
//  trips    → bitácora de viajes realizados
//  expenses → gastos del turno
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CONFIG, withDefaults } from '../lib/pricing.js';
import { load, save, importFromCartera } from '../lib/storage.js';

const Store = createContext(null);
export const COLLECTIONS = ['history', 'clients', 'trips', 'expenses'];
const LIMIT = 2000; // tope por colección para no llenar el localStorage

const newId = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function initial() {
  const s = load();
  const base = Object.fromEntries(COLLECTIONS.map((c) => [c, s[c] || []]));
  if (s.config) return { config: withDefaults(s.config), ...base };
  const imported = importFromCartera();
  return { config: withDefaults({ driver: { ...DEFAULT_CONFIG.driver, ...(imported || {}) } }), ...base };
}

export function AppStoreProvider({ children }) {
  const [state, setState] = useState(initial);
  useEffect(() => save(state), [state]);

  /** Actualiza una sección de la configuración: setSection('costs', { gasPrice: 25 }) */
  const setSection = useCallback((section, patch) => {
    setState((s) => ({ ...s, config: { ...s.config, [section]: { ...s.config[section], ...patch } } }));
  }, []);

  const resetConfig = useCallback(() => setState((s) => ({ ...s, config: withDefaults({ driver: s.config.driver, wifi: s.config.wifi, sos: s.config.sos }) })), []);

  // CRUD genérico para las colecciones. Lo más nuevo va primero.
  const add = useCallback((coll, item) => {
    const full = { id: newId(), createdAt: new Date().toISOString(), ...item };
    setState((s) => ({ ...s, [coll]: [full, ...s[coll]].slice(0, LIMIT) }));
    return full;
  }, []);
  const update = useCallback((coll, id, patch) => {
    setState((s) => ({ ...s, [coll]: s[coll].map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  }, []);
  const remove = useCallback((coll, id) => setState((s) => ({ ...s, [coll]: s[coll].filter((x) => x.id !== id) })), []);

  const value = useMemo(() => ({
    ...state,
    setSection,
    resetConfig,
    add,
    update,
    remove,
    // Atajos usados por las pantallas de la fase 1.
    addQuote: (q) => add('history', { status: 'pendiente', ...q }),
    updateQuote: (id, p) => update('history', id, p),
    removeQuote: (id) => remove('history', id),
  }), [state, setSection, resetConfig, add, update, remove]);

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
