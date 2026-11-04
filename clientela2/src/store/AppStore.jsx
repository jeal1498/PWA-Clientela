// Estado global persistente (localStorage): configuración del conductor + historial de cotizaciones.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEFAULT_CONFIG, withDefaults } from '../lib/pricing.js';
import { load, save, importFromCartera } from '../lib/storage.js';

const Store = createContext(null);

function initial() {
  const s = load();
  if (s.config) return { config: withDefaults(s.config), history: s.history || [] };
  const imported = importFromCartera();
  return { config: withDefaults({ driver: { ...DEFAULT_CONFIG.driver, ...(imported || {}) } }), history: [] };
}

export function AppStoreProvider({ children }) {
  const [state, setState] = useState(initial);

  // Guarda en cada cambio (los datos son pocos; no hace falta debounce).
  useEffect(() => save(state), [state]);

  /** Actualiza una sección: setSection('costs', { gasPrice: 25 }) */
  const setSection = useCallback((section, patch) => {
    setState((s) => ({ ...s, config: { ...s.config, [section]: { ...s.config[section], ...patch } } }));
  }, []);

  const resetConfig = useCallback(() => setState((s) => ({ ...s, config: withDefaults({ driver: s.config.driver }) })), []);

  const addQuote = useCallback((q) => {
    const item = { id: crypto.randomUUID?.() || String(Date.now()), createdAt: new Date().toISOString(), status: 'pendiente', ...q };
    setState((s) => ({ ...s, history: [item, ...s.history].slice(0, 300) }));
    return item;
  }, []);

  const updateQuote = useCallback((id, patch) => {
    setState((s) => ({ ...s, history: s.history.map((h) => (h.id === id ? { ...h, ...patch } : h)) }));
  }, []);

  const removeQuote = useCallback((id) => setState((s) => ({ ...s, history: s.history.filter((h) => h.id !== id) })), []);

  const value = useMemo(
    () => ({ ...state, setSection, resetConfig, addQuote, updateQuote, removeQuote }),
    [state, setSection, resetConfig, addQuote, updateQuote, removeQuote],
  );
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export const useStore = () => useContext(Store);
