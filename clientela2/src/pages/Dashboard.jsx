// Panel del conductor (/app): enlace público, métricas de rentabilidad y accesos rápidos.
import { Link } from 'react-router-dom';
import { Link2, Copy, ExternalLink, Calculator, TrendingUp, Fuel, Settings, Share2, AlertTriangle, Wallet, Plus, BookOpen } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { publicLink } from '../lib/share.js';
import { costPerKm } from '../lib/pricing.js';
import { money, money2 } from '../lib/format.js';
import { copyText } from '../lib/whatsapp.js';
import { Card, CardTitle, Button, Stat } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import DayBalance from '../components/DayBalance.jsx';
import ExpenseQuick from '../components/ExpenseQuick.jsx';
import TripSheet from '../components/TripSheet.jsx';
import { useState } from 'react';

export default function Dashboard() {
  const { config, history } = useStore();
  const [toast, showToast] = useToast();
  const [tripOpen, setTripOpen] = useState(false);
  const link = publicLink(config);

  // Métricas a partir del historial.
  const accepted = history.filter((h) => h.status === 'aceptada');
  const decided = history.filter((h) => h.status !== 'pendiente').length;
  const netSum = accepted.reduce((s, h) => s + (h.net || 0), 0);
  const kmSum = accepted.reduce((s, h) => s + (h.km || 0), 0);
  const pending = history.filter((h) => h.status === 'pendiente').length;
  const conversion = decided ? Math.round((accepted.length / decided) * 100) : 0;
  const avgNetKm = kmSum ? netSum / kmSum : 0;

  return (
    <>
      <h1 className="font-titulo text-2xl">Hola{config.driver.name ? `, ${config.driver.name}` : ''} 👋</h1>

      {!config.driver.phone && (
        <Link to="/app/pagina" className="flex items-center gap-2 rounded-2xl border border-tedebe/30 bg-tedebe/10 p-3 text-sm text-tedebe">
          <AlertTriangle className="size-4 shrink-0" /> Agrega tu WhatsApp para que los clientes te escriban.
        </Link>
      )}

      {/* Balance en vivo del turno + captura rápida */}
      <Card>
        <CardTitle icon={Wallet} right={<Link to="/app/bitacora" className="flex items-center gap-1 text-xs text-cobrado"><BookOpen className="size-3.5" /> Bitácora</Link>}>Hoy</CardTitle>
        <DayBalance />
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button icon={Plus} className="whitespace-nowrap px-3" onClick={() => setTripOpen(true)}>Viaje cobrado</Button>
          <Link to="/app/manual"><Button variant="ghost" icon={Calculator} className="w-full">Cotizar</Button></Link>
        </div>
        <div className="mt-3 text-xs text-gris">Registrar gasto</div>
        <div className="mt-1.5"><ExpenseQuick onSaved={showToast} /></div>
      </Card>

      <Card>
        <CardTitle icon={Link2}>Tu cotizador público</CardTitle>
        <p className="mb-3 text-sm text-gris">Pon este enlace en tu Linktree, Instagram o estado de WhatsApp. Lleva tus tarifas; tus costos y metas no se comparten.</p>
        <div className="mb-3 truncate rounded-xl bg-asfalto px-3 py-2 font-mono text-xs text-gris">{link}</div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="ghost" icon={Copy} onClick={async () => showToast((await copyText(link)) ? 'Enlace copiado' : 'No se pudo copiar')}>Copiar</Button>
          <Button variant="ghost" icon={Share2} onClick={() => (navigator.share ? navigator.share({ title: 'Cotiza tu viaje', url: link }).catch(() => {}) : copyText(link).then(() => showToast('Enlace copiado')))}>Compartir</Button>
          <Button variant="ghost" icon={ExternalLink} as="a" href={link} target="_blank" rel="noopener">Abrir</Button>
        </div>
        <p className="mt-2 text-xs text-gris/70">Si cambias tus tarifas, vuelve a copiar el enlace.</p>
      </Card>

      <Card>
        <CardTitle icon={TrendingUp} right={<Link to="/app/historial" className="text-xs text-cobrado">Ver historial</Link>}>Cotizaciones</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="Neto de viajes aceptados" value={money(netSum)} tone="green" />
          <Stat label="Neto promedio por km" value={money2(avgNetKm)} tone={!kmSum ? undefined : avgNetKm >= config.goals.minPerKm ? 'green' : 'red'} />
          <Stat label="Cotizaciones pendientes" value={pending} tone={pending ? 'yellow' : undefined} />
          <Stat label="Aceptación" value={`${conversion} %`} />
        </div>
      </Card>

      <Card>
        <CardTitle icon={Fuel} right={<Link to="/app/settings" className="flex items-center gap-1 text-xs text-cobrado"><Settings className="size-3.5" /> Editar</Link>}>Tus números</CardTitle>
        <div className="grid grid-cols-2 gap-2">
          <Stat small label="Te cuesta cada km" value={money2(costPerKm(config.costs))} tone="yellow" />
          <Stat small label="Cobras por km" value={money2(config.rates.perKm)} />
          <Stat small label="Meta neta por km" value={money2(config.goals.minPerKm)} />
          <Stat small label="Meta neta por hora" value={money(config.goals.minPerHour)} />
        </div>
        {config.rates.perKm <= costPerKm(config.costs) && <p className="mt-2 text-xs text-atrasado">Tu tarifa por km no cubre tu costo por km.</p>}
      </Card>
      <TripSheet open={tripOpen} onClose={() => setTripOpen(false)} onSaved={() => showToast('Viaje guardado en bitácora')} />
      {toast}
    </>
  );
}
