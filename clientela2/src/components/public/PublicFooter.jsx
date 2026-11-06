// 6 · Pie: redes del conductor. Sin acceso al panel: el conductor entra desde su app.
import { Facebook, Instagram } from 'lucide-react';

// lucide no trae el logo de TikTok: nota musical simple con el mismo grosor.
const TikTok = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.5 2.6 2.3 4.4 5 4.8" />
  </svg>
);

const NETS = [
  { key: 'tiktok', label: 'TikTok', icon: TikTok, url: (u) => `https://www.tiktok.com/@${u}` },
  { key: 'instagram', label: 'Instagram', icon: Instagram, url: (u) => `https://instagram.com/${u}` },
  { key: 'facebook', label: 'Facebook', icon: Facebook, url: (u) => `https://facebook.com/${u}` },
];

/** Acepta usuario («@lalo»), o enlace completo. */
const href = (net, v) => (/^https?:\/\//.test(v) ? v : net.url(String(v).replace(/^@/, '').trim()));

export default function PublicFooter({ driver, social }) {
  const nets = NETS.filter((n) => String(social[n.key] || '').trim());
  return (
    <footer className="mt-10 border-t border-white/5 pt-6 text-center">
      {nets.length > 0 && (
        <div className="mb-4 flex justify-center gap-3">
          {nets.map((n) => (
            <a key={n.key} href={href(n, social[n.key])} target="_blank" rel="noopener" aria-label={`${driver.name || 'Conductor'} en ${n.label}`} className="grid size-11 place-items-center rounded-full bg-tablero text-hueso active:scale-95">
              <n.icon className="size-5" />
            </a>
          ))}
        </div>
      )}
      <p className="text-sm text-gris">Precios estimados; pueden variar por tráfico, casetas o cambios de ruta.</p>
      <p className="mt-1 text-[13px] text-gris">Hecho con Clientela · de la familia Checa</p>
    </footer>
  );
}
