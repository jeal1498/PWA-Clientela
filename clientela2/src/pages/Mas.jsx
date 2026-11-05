// «Más»: lo que se usa menos seguido, para no saturar la barra inferior.
import { Link } from 'react-router-dom';
import { History, Receipt, Wifi, Settings, Globe, ChevronRight, ShieldAlert } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { Card } from '../components/ui.jsx';

export default function Mas() {
  const { history, config } = useStore();
  const pending = history.filter((h) => h.status === 'pendiente').length;
  const items = [
    { to: '/app/pagina', icon: Globe, label: 'Mi página', hint: 'Vehículo, estado, servicios, políticas y QR del auto' },
    { to: '/app/gastos', icon: Receipt, label: 'Gastos', hint: 'Combustible, casetas, lavado, hormiga' },
    { to: '/app/historial', icon: History, label: 'Cotizaciones', hint: pending ? `${pending} pendientes` : 'Guardadas' },
    { to: '/app/wifi', icon: Wifi, label: 'Wi-Fi a bordo', hint: config.wifi.ssid ? `QR de «${config.wifi.ssid}»` : 'Sin configurar' },
    { to: '/app/settings#sos', icon: ShieldAlert, label: 'Seguridad', hint: config.sos.phone ? `Contacto: ${config.sos.name || config.sos.phone}` : 'Agrega tu contacto de emergencia' },
    { to: '/app/settings', icon: Settings, label: 'Costos y ajustes', hint: 'Tarifas, metas, perfil' },
    { to: '/', icon: Globe, label: 'Ver mi página pública', hint: 'Como la ve tu cliente' },
  ];
  return (
    <>
      <h1 className="font-titulo text-2xl">Más</h1>
      <Card className="divide-y divide-white/5 p-0">
        {items.map(({ to, icon: Icon, label, hint }) => (
          <Link key={to + label} to={to} className="flex items-center gap-3 px-4 py-3.5 active:bg-white/5">
            <Icon className="size-5 text-gris" />
            <div className="min-w-0 flex-1"><div>{label}</div><div className="truncate text-xs text-gris">{hint}</div></div>
            <ChevronRight className="size-4 text-gris" />
          </Link>
        ))}
      </Card>
    </>
  );
}
