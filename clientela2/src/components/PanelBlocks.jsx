// Bloques que antes vivían en Hoy y ahora están en Mi página (enlace) y Resumen (cotizaciones y números).
import { Link } from 'react-router-dom';
import { Link2, Copy, ExternalLink, Share2, TrendingUp, Fuel, Settings } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { publicLink } from '../lib/share.js';
import { costPerKm } from '../lib/pricing.js';
import { money, money2 } from '../lib/format.js';
import { copyText } from '../lib/whatsapp.js';
import { Card, CardTitle, Button, Stat } from './ui.jsx';
import { useToast } from './Toast.jsx';

export function PublicLinkCard() {
  const { config } = useStore();
  const [toast, showToast] = useToast();
  const link = publicLink(config);
  return (
    <Card>
      <CardTitle icon={Link2}>Tu cotizador público</CardTitle>
      <p className="mb-3 text-sm text-gris">Pon este enlace en tu Linktree, Instagram o estado de WhatsApp. Lleva tus tarifas; tus costos y metas no se comparten.</p>
      <div className="mb-3 truncate rounded-xl bg-asfalto px-3 py-2 font-mono text-xs text-gris">{link}</div>
      <div className="grid grid-cols-3 gap-2">
        <Button variant="ghost" icon={Copy} onClick={async () => showToast((await copyText(link)) ? 'Enlace copiado' : 'No se pudo copiar')}>Copiar</Button>
        <Button variant="ghost" icon={Share2} onClick={() => (navigator.share ? navigator.share({ title: 'Cotiza tu viaje', url: link }).catch(() => {}) : copyText(link).then(() => showToast('Enlace copiado')))}>Compartir</Button>
        <Button variant="ghost" icon={ExternalLink} as="a" href={link} target="_blank" rel="noopener">Abrir</Button>
      </div>
      <p className="mt-2 text-xs text-gris">Si cambias tus tarifas, vuelve a copiar el enlace.</p>
      {toast}
    </Card>
  );
}

export function QuoteStats() {
  const { config, history } = useStore();
  const accepted = history.filter((h) => h.status === 'aceptada');
  const decided = history.filter((h) => h.status !== 'pendiente').length;
  const netSum = accepted.reduce((s, h) => s + (h.net || 0), 0);
  const kmSum = accepted.reduce((s, h) => s + (h.km || 0), 0);
  const pending = history.filter((h) => h.status === 'pendiente').length;
  const conversion = decided ? Math.round((accepted.length / decided) * 100) : 0;
  const avgNetKm = kmSum ? netSum / kmSum : 0;
  return (
    <Card>
      <CardTitle icon={TrendingUp} right={<Link to="/app/viajes?s=propuestas" className="inline-flex min-h-11 items-center text-xs text-ok">Ver propuestas</Link>}>Cotizaciones</CardTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Neto de viajes aceptados" value={money(netSum)} tone="green" />
        <Stat label="Neto promedio por km" value={money2(avgNetKm)} tone={!kmSum ? undefined : avgNetKm >= config.goals.minPerKm ? 'green' : 'red'} />
        <Stat label="Cotizaciones pendientes" value={pending} tone={pending ? 'yellow' : undefined} />
        <Stat label="Aceptación" value={`${conversion} %`} />
      </div>
    </Card>
  );
}

export function MyNumbers() {
  const { config } = useStore();
  return (
    <Card>
      <CardTitle icon={Fuel} right={<Link to="/app/settings" className="inline-flex min-h-11 items-center gap-1 text-xs text-ok"><Settings className="size-3.5" /> Editar</Link>}>Tus números</CardTitle>
      <div className="grid grid-cols-2 gap-2">
        <Stat small label="Te cuesta cada km" value={money2(costPerKm(config.costs))} tone="yellow" />
        <Stat small label="Cobras por km" value={money2(config.rates.perKm)} />
        <Stat small label="Meta neta por km" value={money2(config.goals.minPerKm)} />
        <Stat small label="Meta neta por hora" value={money(config.goals.minPerHour)} />
      </div>
      {config.rates.perKm <= costPerKm(config.costs) && <p className="mt-2 text-xs text-malo">Tu tarifa por km no cubre tu costo por km.</p>}
    </Card>
  );
}
