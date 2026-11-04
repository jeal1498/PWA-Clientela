// Marco del panel del conductor: encabezado (con SOS siempre a la mano) + barra inferior de 5 pestañas.
import { useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { Sun, Calculator, BookOpen, Users, Menu } from 'lucide-react';
import { cx } from './ui.jsx';
import SosButton from './SosButton.jsx';

const TABS = [
  { to: '/app', end: true, label: 'Hoy', icon: Sun },
  { to: '/app/manual', label: 'Cotizar', icon: Calculator },
  { to: '/app/bitacora', label: 'Bitácora', icon: BookOpen },
  { to: '/app/clientes', label: 'Clientes', icon: Users },
  { to: '/app/mas', label: 'Más', icon: Menu, also: ['/app/gastos', '/app/historial', '/app/wifi', '/app/settings'] },
];

export default function AppShell() {
  const { pathname, hash } = useLocation();
  // Cambio de pantalla: arriba del todo, o a la sección pedida (#sos, #wifi).
  useEffect(() => {
    const id = hash.replace('#', '');
    const el = id && document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-white/5 bg-asfalto/90 px-4 py-3 backdrop-blur">
        <img src="./icon.svg" alt="" className="size-8" />
        <div className="flex-1 leading-tight">
          <div className="font-titulo text-lg">Clientela</div>
          <div className="text-xs text-gris">Cotizador 2.0</div>
        </div>
        <SosButton />
      </header>
      <main className="space-y-4 px-4 pt-4 pb-safe"><Outlet /></main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-tablero/95 backdrop-blur" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {TABS.map(({ to, end, label, icon: Icon, also }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex h-16 flex-col items-center justify-center gap-1 text-[11px]', isActive || also?.some((p) => pathname.startsWith(p)) ? 'text-cobrado' : 'text-gris')}>
              <Icon className="size-5" aria-hidden />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
