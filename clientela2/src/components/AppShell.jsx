// Marco del panel del conductor: encabezado (con SOS siempre a la mano) + barra inferior: Hoy · Viajes · + · Clientes · Yo.
// El «+» del centro abre un menú de 4 acciones rápidas.
import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sun, CalendarClock, Plus, Users, User, Calculator, CheckCheck, Receipt, CalendarPlus, X } from 'lucide-react';
import { cx } from './ui.jsx';
import SosButton from './SosButton.jsx';
import Sheet from './Sheet.jsx';
import TripSheet from './TripSheet.jsx';
import AgendaSheet from './AgendaSheet.jsx';
import ExpenseSheet from './ExpenseSheet.jsx';
import { EXPENSE_CATS } from '../lib/ledger.js';
import { useToast } from './Toast.jsx';

const IZQ = [
  { to: '/app', end: true, label: 'Hoy', icon: Sun },
  { to: '/app/viajes', label: 'Viajes', icon: CalendarClock, also: ['/app/agenda', '/app/bitacora', '/app/historial'] },
];
const DER = [
  { to: '/app/clientes', label: 'Clientes', icon: Users, also: ['/app/cobros'] },
  { to: '/app/yo', label: 'Yo', icon: User, also: ['/app/ganancias', '/app/pagina', '/app/settings', '/app/gastos', '/app/resumen', '/app/wifi', '/app/mas'] },
];

export default function AppShell() {
  const { pathname, hash } = useLocation();
  const navigate = useNavigate();
  const [menu, setMenu] = useState(false);
  const [trip, setTrip] = useState(false);
  const [agenda, setAgenda] = useState(false);
  const [gasto, setGasto] = useState(null);
  const [toast, showToast] = useToast();

  // Cambio de pantalla: arriba del todo, o a la sección pedida (#sos, #wifi).
  useEffect(() => {
    const id = hash.replace('#', '');
    const el = id && document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else scrollTo(0, 0);
  }, [pathname, hash]);

  const acciones = [
    { icon: Calculator, label: 'Cotizar un viaje', sub: 'Ruta, precio y enviar', run: () => navigate('/app/manual') },
    { icon: CheckCheck, label: 'Registrar viaje hecho', sub: 'Ya lo hice, anotar el cobro', run: () => setTrip(true) },
    { icon: Receipt, label: 'Anotar gasto', sub: 'Gasolina, caseta, lavado', run: () => setGasto(Object.keys(EXPENSE_CATS)[0]) },
    { icon: CalendarPlus, label: 'Agendar viaje', sub: 'Para otra fecha u hora', run: () => setAgenda(true) },
  ];
  const tab = ({ to, end, label, icon: Icon, also }) => (
    <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex h-16 flex-col items-center justify-center gap-1 text-xs', isActive || also?.some((p) => pathname.startsWith(p)) ? 'text-ok' : 'text-gris')}>
      <Icon className="size-5" aria-hidden />
      {label}
    </NavLink>
  );

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[15rem_1fr]">
      {/* Computadora (lg): barra lateral en lugar de la barra inferior. */}
      <aside className="sticky top-0 hidden h-dvh flex-col gap-1 border-r border-hueso/5 bg-tablero p-4 lg:flex">
        <div className="mb-4 flex items-center gap-3 px-2">
          <img src="./icon.svg" alt="" className="size-8" />
          <div className="leading-tight"><div className="font-titulo text-lg">Clientela</div><div className="text-xs text-gris">Tus clientes, en orden</div></div>
        </div>
        {[...IZQ, ...DER].map(({ to, end, label, icon: Icon, also }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => cx('flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold', isActive || also?.some((p) => pathname.startsWith(p)) ? 'bg-asfalto text-ok' : 'text-gris hover:bg-hueso/5')}>
            <Icon className="size-5" aria-hidden />
            {label}
          </NavLink>
        ))}
        <button type="button" onClick={() => setMenu(true)} className="mt-3 flex h-11 items-center justify-center gap-2 rounded-xl bg-cobrado font-semibold text-[#04210f] active:scale-[.98]"><Plus className="size-5" aria-hidden /> Nuevo</button>
      </aside>

      <div className="mx-auto w-full max-w-lg md:max-w-3xl lg:max-w-4xl">
      <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-hueso/5 bg-asfalto/90 px-4 py-3 backdrop-blur md:px-6 lg:justify-end">
        <img src="./icon.svg" alt="" className="size-8 lg:hidden" />
        <div className="flex-1 leading-tight lg:hidden">
          <div className="font-titulo text-lg">Clientela</div>
          <div className="text-xs text-gris">Tus clientes, en orden</div>
        </div>
        <SosButton />
      </header>
      <main className="space-y-4 px-4 pt-4 pb-safe md:px-6 lg:pb-8!"><Outlet /></main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-hueso/5 bg-tablero/95 backdrop-blur lg:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="mx-auto grid max-w-lg grid-cols-5">
          {IZQ.map(tab)}
          <button type="button" aria-label="Nuevo: cotizar, registrar, anotar gasto o agendar" aria-haspopup="dialog" onClick={() => setMenu(true)} className="flex h-16 items-center justify-center">
            <span className="-mt-3 grid h-11 w-14 place-items-center rounded-2xl bg-cobrado text-[#04210f] shadow-lg active:scale-95"><Plus className="size-6" aria-hidden /></span>
          </button>
          {DER.map(tab)}
        </div>
      </nav>

      <Sheet open={menu} onClose={() => setMenu(false)} title="¿Qué quieres hacer?">
        <div className="space-y-2">
          {acciones.map(({ icon: Icon, label, sub, run }) => (
            <button key={label} type="button" onClick={() => { setMenu(false); run(); }} className="flex min-h-14 w-full items-center gap-3 rounded-2xl border border-hueso/10 bg-asfalto px-3 py-2 text-left active:scale-[.99]">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cobrado text-[#04210f]"><Icon className="size-5" aria-hidden /></span>
              <span><span className="block font-bold">{label}</span><span className="block text-xs text-gris">{sub}</span></span>
            </button>
          ))}
          <button type="button" onClick={() => setMenu(false)} className="flex min-h-11 w-full items-center justify-center gap-1 text-sm text-gris"><X className="size-4" aria-hidden /> Cancelar</button>
        </div>
      </Sheet>
      <TripSheet open={trip} onClose={() => setTrip(false)} onSaved={() => { showToast('Viaje guardado en Viajes → Hechos'); navigate('/app/viajes?s=hechos'); }} />
      <AgendaSheet open={agenda} onClose={() => setAgenda(false)} onSaved={(t) => { showToast(`Agendado ${t.time} · ${t.clientName || 'Sin nombre'}`); navigate('/app/viajes?s=porhacer'); }} />
      <ExpenseSheet sugeridos cat={gasto} onClose={() => setGasto(null)} onSaved={showToast} />
      {toast}
    </div>
  );
}
