import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AppStoreProvider } from './store/AppStore.jsx';
import AppShell from './components/AppShell.jsx';
import RequireAuth from './components/RequireAuth.jsx';
import PublicQuote from './pages/PublicQuote.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';
import ManualQuote from './pages/ManualQuote.jsx';
import Clientes from './pages/Clientes.jsx';
import Viajes from './pages/Viajes.jsx';
import Yo from './pages/Yo.jsx';
import Ganancias from './pages/Ganancias.jsx';
import PageSettings from './pages/PageSettings.jsx';

// HashRouter: GitHub Pages no reescribe rutas, así #/app/manual funciona sin 404.
export default function App() {
  return (
    <AppStoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PublicQuote />} />
          <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
            <Route index element={<Dashboard />} />
            <Route path="manual" element={<ManualQuote />} />
            <Route path="viajes" element={<Viajes />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="yo" element={<Yo />} />
            <Route path="ganancias" element={<Ganancias />} />
            <Route path="pagina" element={<PageSettings />} />
            <Route path="settings" element={<Settings />} />
            {/* Rutas anteriores: se conservan como atajos para enlaces viejos. */}
            <Route path="agenda" element={<Navigate to="/app/viajes?s=porhacer" replace />} />
            <Route path="bitacora" element={<Navigate to="/app/viajes?s=hechos" replace />} />
            <Route path="historial" element={<Navigate to="/app/viajes?s=propuestas" replace />} />
            <Route path="cobros" element={<Navigate to="/app/clientes?f=debe" replace />} />
            <Route path="resumen" element={<Navigate to="/app/ganancias?s=resumen" replace />} />
            <Route path="gastos" element={<Navigate to="/app/ganancias?s=gastos" replace />} />
            <Route path="mas" element={<Navigate to="/app/yo" replace />} />
            <Route path="wifi" element={<Navigate to="/app/pagina#wifi" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppStoreProvider>
  );
}
