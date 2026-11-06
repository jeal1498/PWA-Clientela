import { HashRouter, Route, Routes, Navigate } from 'react-router-dom';
import { AppStoreProvider } from './store/AppStore.jsx';
import AppShell from './components/AppShell.jsx';
import PublicQuote from './pages/PublicQuote.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Settings from './pages/Settings.jsx';
import ManualQuote from './pages/ManualQuote.jsx';
import History from './pages/History.jsx';
import Bitacora from './pages/Bitacora.jsx';
import Gastos from './pages/Gastos.jsx';
import Clientes from './pages/Clientes.jsx';
import Cobros from './pages/Cobros.jsx';
import Mas from './pages/Mas.jsx';
import WifiPage from './pages/WifiPage.jsx';
import PageSettings from './pages/PageSettings.jsx';

// HashRouter: GitHub Pages no reescribe rutas, así #/app/manual funciona sin 404.
export default function App() {
  return (
    <AppStoreProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<PublicQuote />} />
          <Route path="/app" element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="manual" element={<ManualQuote />} />
            <Route path="historial" element={<History />} />
            <Route path="settings" element={<Settings />} />
            <Route path="bitacora" element={<Bitacora />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="cobros" element={<Cobros />} />
            <Route path="mas" element={<Mas />} />
            <Route path="wifi" element={<WifiPage />} />
            <Route path="pagina" element={<PageSettings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AppStoreProvider>
  );
}
