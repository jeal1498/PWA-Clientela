// Clientes frecuentes (CRM básico): datos, notas, tarifa preferencial y rutas habituales.
// «Re-cotizar» abre WhatsApp con la propuesta de la ruta habitual en un toque.
import { useEffect, useMemo, useState } from 'react';
import { Plus, Search, Phone, MessageCircle, Pencil, Trash2, Repeat, Route as RouteIcon, Users, Star } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { quote, roundUp } from '../lib/pricing.js';
import { money, kmText, minText, waNumber } from '../lib/format.js';
import { driverProposalMessage, waLink } from '../lib/whatsapp.js';
import { useRoute } from '../hooks/useRoute.js';
import { Card, Field, TextInput, NumberInput, Button, cx } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import PlaceInput from '../components/PlaceInput.jsx';
import { useToast } from '../components/Toast.jsx';

const newId = () => crypto.randomUUID?.() || String(Date.now());

/** Precio de una ruta habitual: el fijo si lo tiene; si no, la tarifa normal con el descuento del cliente. */
export function routePrice(route, client, config) {
  if (+route.price > 0) return +route.price;
  const base = quote({ km: route.km, min: route.min }, config).price;
  const d = Math.min(100, Math.max(0, +client.discount || 0));
  return d ? roundUp(base * (1 - d / 100), config.rates.rounding) : base;
}

export function recotizarLink(route, client, config) {
  const price = routePrice(route, client, config);
  const q = { ...quote({ km: route.km, min: route.min }, config), lines: [] };
  const text = driverProposalMessage({ clientName: client.name, from: route.from, to: route.to, q, price, driverName: config.driver.name });
  return waLink(client.phone, text, config.driver.lada);
}

export default function Clientes() {
  const { clients, config, add, update, remove } = useStore();
  const [q, setQ] = useState('');
  const [editing, setEditing] = useState(null); // cliente o {} para nuevo
  const [toast, showToast] = useToast();

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return [...clients].filter((c) => !t || c.name.toLowerCase().includes(t) || (c.phone || '').includes(t)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }, [clients, q]);

  function save(c) {
    if (c.id) update('clients', c.id, c);
    else add('clients', c);
    showToast('Cliente guardado');
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <h1 className="font-titulo text-2xl">Clientes</h1>
        <Button icon={Plus} className="h-10" onClick={() => setEditing({})}>Nuevo</Button>
      </div>
      {clients.length > 3 && (
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-gris" />
          <TextInput className="pl-9" placeholder="Buscar por nombre o teléfono" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      )}
      {!clients.length && (
        <Card className="py-10 text-center text-gris">
          <Users className="mx-auto mb-2 size-8" />
          Guarda a tus clientes habituales y sus rutas para cotizarles en un toque.
        </Card>
      )}
      {list.map((c) => {
        const tel = waNumber(c.phone, config.driver.lada);
        const icon = 'grid size-9 place-items-center rounded-xl bg-asfalto active:scale-95';
        return (
          <Card key={c.id} className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 truncate font-semibold">
                  {c.name}
                  {+c.discount > 0 && <span className="flex items-center gap-0.5 rounded-full bg-tedebe/15 px-2 py-0.5 text-[11px] text-tedebe"><Star className="size-3" />−{c.discount} %</span>}
                </div>
                {c.phone && <div className="text-xs text-gris">{c.phone}</div>}
                {c.notes && <div className="mt-1 text-xs text-hueso/80">📝 {c.notes}</div>}
              </div>
              {tel && <a className={icon} href={`tel:+${tel}`} aria-label={`Llamar a ${c.name}`}><Phone className="size-4 text-gris" /></a>}
              {tel && <a className={icon} href={`https://wa.me/${tel}`} target="_blank" rel="noopener" aria-label={`WhatsApp a ${c.name}`}><MessageCircle className="size-4 text-[#25D366]" /></a>}
              <button type="button" className={icon} aria-label="Editar" onClick={() => setEditing(c)}><Pencil className="size-4 text-gris" /></button>
            </div>
            {(c.routes || []).map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-2xl bg-asfalto/60 p-2 pl-3">
                <RouteIcon className="size-4 shrink-0 text-gris" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm">{r.name || `${r.from} → ${r.to}`}</div>
                  <div className="truncate text-xs text-gris">{kmText(r.km)} · {minText(r.min)} · <span className="font-mono text-hueso">{money(routePrice(r, c, config))}</span>{+r.price > 0 && ' fijo'}</div>
                </div>
                <Button variant="whatsapp" icon={Repeat} className="h-10 px-3 text-sm" as="a" disabled={!tel} href={tel ? recotizarLink(r, c, config) : undefined} target="_blank" rel="noopener" aria-label={`Re-cotizar ${r.name || 'ruta'} a ${c.name}`}>
                  Re-cotizar
                </Button>
              </div>
            ))}
          </Card>
        );
      })}
      <ClientEditor client={editing} onClose={() => setEditing(null)} onSave={save} onDelete={(id) => { remove('clients', id); showToast('Cliente borrado'); }} />
      {toast}
    </>
  );
}

/** Alta / edición de cliente con sus rutas habituales. */
function ClientEditor({ client, onClose, onSave, onDelete }) {
  const { config } = useStore();
  const [c, setC] = useState(null);
  const [addingRoute, setAddingRoute] = useState(false);
  useEffect(() => { if (client) { setC({ name: '', phone: '', notes: '', discount: '', routes: [], ...client }); setAddingRoute(false); } }, [client]);
  if (!client || !c) return null;
  const set = (p) => setC((s) => ({ ...s, ...p }));

  return (
    <Sheet open onClose={onClose} title={client.id ? 'Editar cliente' : 'Nuevo cliente'}>
      <div className="space-y-3">
        <Field label="Nombre"><TextInput autoFocus value={c.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej. Sra. Martha" /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Teléfono / WhatsApp"><TextInput type="tel" inputMode="tel" value={c.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="10 dígitos" /></Field>
          <Field label="Tarifa preferencial" hint="Descuento sobre tu tarifa."><NumberInput suffix="% desc." value={c.discount} onChange={(discount) => set({ discount })} placeholder="0" /></Field>
        </div>
        <Field label="Notas especiales"><TextInput value={c.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Silla para bebé, paga con transferencia…" /></Field>

        <div>
          <div className="mb-1.5 text-sm text-gris">Rutas frecuentes</div>
          <div className="space-y-1.5">
            {c.routes.map((r) => (
              <div key={r.id} className="flex items-center gap-2 rounded-2xl bg-asfalto p-2 pl-3 text-sm">
                <span className="min-w-0 flex-1 truncate">{r.name || `${r.from} → ${r.to}`} <span className="text-gris">· {kmText(r.km)}{+r.price > 0 ? ` · ${money(r.price)} fijo` : ''}</span></span>
                <button type="button" aria-label="Quitar ruta" onClick={() => set({ routes: c.routes.filter((x) => x.id !== r.id) })} className="grid size-8 place-items-center"><Trash2 className="size-4 text-atrasado" /></button>
              </div>
            ))}
          </div>
          {addingRoute ? (
            <RouteForm city={config.driver.city} onCancel={() => setAddingRoute(false)} onAdd={(r) => { set({ routes: [...c.routes, { id: newId(), ...r }] }); setAddingRoute(false); }} />
          ) : (
            <Button variant="outline" icon={Plus} className="mt-2 w-full" onClick={() => setAddingRoute(true)}>Agregar ruta</Button>
          )}
        </div>

        <Button className="w-full" disabled={!c.name.trim()} onClick={() => { onSave({ ...c, name: c.name.trim(), discount: +c.discount || 0 }); onClose(); }}>Guardar cliente</Button>
        {client.id && <Button variant="danger" icon={Trash2} className="w-full" onClick={() => confirm(`¿Borrar a ${c.name}?`) && (onDelete(client.id), onClose())}>Borrar cliente</Button>}
      </div>
    </Sheet>
  );
}

/** Ruta: busca origen y destino (calcula km/min) o escríbelos a mano. Precio fijo opcional. */
function RouteForm({ city, onAdd, onCancel }) {
  const [from, setFrom] = useState(null);
  const [to, setTo] = useState(null);
  const [name, setName] = useState('');
  const [km, setKm] = useState('');
  const [min, setMin] = useState('');
  const [price, setPrice] = useState('');
  const r = useRoute(from, to);
  useEffect(() => { if (r.km) { setKm(r.km); setMin(r.min); } }, [r.km, r.min]);
  const ok = +km > 0;
  return (
    <div className={cx('mt-2 space-y-2 rounded-2xl border border-white/10 p-3')}>
      <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre: Casa → Oficina" />
      <PlaceInput label="Origen de la ruta" placeholder="Origen" value={from} onChange={setFrom} city={city} />
      <PlaceInput label="Destino de la ruta" placeholder="Destino" value={to} onChange={setTo} city={city} dot="bg-atrasado" />
      <div className="grid grid-cols-3 gap-2">
        <NumberInput suffix="km" value={km} onChange={setKm} placeholder="km" aria-label="Kilómetros" />
        <NumberInput suffix="min" value={min} onChange={setMin} placeholder="min" aria-label="Minutos" />
        <NumberInput prefix="$" value={price} onChange={setPrice} placeholder="fijo" aria-label="Precio fijo (opcional)" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="ghost" onClick={onCancel}>Cancelar</Button>
        <Button disabled={!ok} onClick={() => onAdd({ name: name.trim(), from: from?.label || '', to: to?.label || '', km: +km, min: +min || Math.round((+km / 30) * 60), price: +price || 0 })}>Agregar</Button>
      </div>
    </div>
  );
}
