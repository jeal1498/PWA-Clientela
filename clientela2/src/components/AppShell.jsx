// Marco del panel del conductor: encabezado + barra inferior fija (pulgar).
import { NavLink, Outlet, Link } from 'react-router-dom';
import { LayoutDashboard, Calculator, History, Settings, Globe } from 'lucide-react';
import { cx } from './ui.jsx';

const TABS = [
  { to: '/app', end: true, label: 'Panel', icon: LayoutDashboard },
  { to: '/app/manual', label: 'Cotizar', icon: Calculator },
  { to: '/app/historial', label: 'Historial', icon: History },
  { to: '/app/settings', label: 'Costos', icon: Settings },
];

export default function AppShell() {
  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-asfalto/90 px-4 py-3 backdrop-blur">
        <img src="./icon.svg" alt="" className="size-8" />
        <div className="flex-1 leading-tight">
          <div className="font-titulo text-lg">Clientela</div>
          <div className="text-xs text-gris">Cotizador 2.0</div>
        </div>
        <Link to="/" className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1.5 text-xs text-gris"><Globe className="size-3.5" /> Vista pública</Link>
      </header>
      <main className="space-y-4 px-4 pt-4 pb-safe"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-tablero/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto grid max-w-lg grid-cols-4">
          {TABS.map(({ to, end, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex h-16 flex-col items-center justify-center gap-1 text-[11px]', isActive ? 'text-cobrado' : 'text-gris')}>
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
