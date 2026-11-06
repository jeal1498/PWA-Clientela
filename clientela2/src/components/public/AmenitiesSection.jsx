// 4 · A bordo: Wi-Fi (copiar contraseña + QR) y amenidades de confort.
import { BatteryCharging, Snowflake, Music, Package, GlassWater } from 'lucide-react';
import WifiCard from '../WifiCard.jsx';
import Section from './Section.jsx';

export const AMENITIES = [
  { key: 'chargers', icon: BatteryCharging, label: 'Cargadores USB', sub: 'Android y iPhone' },
  { key: 'ac', icon: Snowflake, label: 'Aire acondicionado' },
  { key: 'music', icon: Music, label: 'Música a tu elección', sub: 'Bluetooth' },
  { key: 'trunk', icon: Package, label: 'Cajuela amplia' },
  { key: 'water', icon: GlassWater, label: 'Agua de cortesía' },
];

export default function AmenitiesSection({ wifi, amenities, onToast }) {
  const list = AMENITIES.filter((a) => amenities[a.key]);
  if (!wifi?.ssid && !list.length) return null;
  return (
    <Section id="a-bordo" title="A bordo" subtitle="Para tu comodidad durante el viaje.">
      <div className="space-y-3">
        <WifiCard wifi={wifi} onToast={onToast} />
        {list.length > 0 && (
          <ul className="grid grid-cols-2 gap-2">
            {list.map(({ key, icon: Icon, label, sub }) => (
              <li key={key} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-tablero p-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-asfalto text-hueso"><Icon className="size-5" aria-hidden /></span>
                <span className="min-w-0 text-sm leading-tight">{label}{sub && <span className="block text-xs text-gris">{sub}</span>}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Section>
  );
}
