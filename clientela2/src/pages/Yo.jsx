// «Yo»: solo 3 entradas. Reemplaza a «Más».
import { Link } from 'react-router-dom';
import { ChartColumn, Globe, Settings, ChevronRight } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { resumen } from '../lib/stats.js';
import { today } from '../lib/dates.js';
import { money } from '../lib/format.js';
import { Card } from '../components/ui.jsx';

export default function Yo() {
  const { config, trips, expenses } = useStore();
  const sem = resumen(trips, expenses, 'sem', today());
  const items = [
    { to: '/app/ganancias', icon: ChartColumn, label: 'Mis ganancias', hint: `Esta semana ${money(sem.net ?? 0)} neto · gastos y metas` },
    { to: '/app/pagina', icon: Globe, label: 'Mi página', hint: 'Enlace, datos, vehículo, Wi-Fi, QR y estado' },
    { to: '/app/settings', icon: Settings, label: 'Ajustes', hint: config.sos.phone ? 'Costos, tarifas y Seguridad (SOS) listo' : 'Costos, tarifas y Seguridad: agrega tu contacto SOS' },
  ];
  return (
    <>
      <h1 className="font-titulo text-2xl">Yo</h1>
      <Card className="divide-y divide-hueso/5 p-0">
        {items.map(({ to, icon: Icon, label, hint }) => (
          <Link key={to} to={to} className="flex min-h-16 items-center gap-3 px-4 py-3.5 active:bg-hueso/5">
            <Icon className="size-5 text-gris" aria-hidden />
            <div className="min-w-0 flex-1"><div className="text-base">{label}</div><div className="truncate text-xs text-gris">{hint}</div></div>
            <ChevronRight className="size-4 text-gris" aria-hidden />
          </Link>
        ))}
      </Card>
      <Link to="/?vista=1" className="flex min-h-11 items-center justify-center text-sm text-ok">Ver mi página pública</Link>
    </>
  );
}
