// Página pública (Linktree / QR del vehículo). Bloques en orden de conversión:
//   1 Perfil y contacto · 2 Cotizador · 3 Servicios y cobertura · 4 A bordo · 5 Pagos y políticas · 6 Pie
// Lee los datos del enlace (#/?c=…); sin enlace muestra la vista previa con los datos del propio conductor.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { MessageCircle, Calculator, Settings, Copy, ExternalLink, AlertTriangle } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { decodeConfig, publicLink } from '../lib/share.js';
import { saveVCard } from '../lib/vcard.js';
import { copyText } from '../lib/whatsapp.js';
import { money } from '../lib/format.js';
import { useToast } from '../components/Toast.jsx';
import { Button, Card } from '../components/ui.jsx';
import Sheet from '../components/Sheet.jsx';
import ProfileHeader from '../components/public/ProfileHeader.jsx';
import QuoteSection from '../components/public/QuoteSection.jsx';
import ServicesSection from '../components/public/ServicesSection.jsx';
import AmenitiesSection from '../components/public/AmenitiesSection.jsx';
import PaymentsPolicies from '../components/public/PaymentsPolicies.jsx';
import PublicFooter from '../components/public/PublicFooter.jsx';
import Section from '../components/public/Section.jsx';
import { SERVICES } from '../components/public/services.js';

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

export default function PublicQuote() {
  const [params] = useSearchParams();
  const store = useStore();
  const code = params.get('c');
  const shared = useMemo(() => (code ? decodeConfig(code) : null), [code]);
  const broken = !!code && !shared;
  const config = shared || store.config;
  const { driver, vehicle, page, wifi } = config;
  const isPreview = !code;

  const [toast, showToast] = useToast();
  const [service, setService] = useState(() => SERVICES.find((s) => page.services[s.key])?.key || 'urban');
  const [cta, setCta] = useState({ ready: false, href: null, price: 0 });
  const [inAppHelp, setInAppHelp] = useState(false);
  const onState = useCallback((s) => setCta(s), []);

  useEffect(() => { document.title = driver.name ? `${driver.name} · Transporte privado` : 'Cotiza tu viaje'; }, [driver.name]);

  // vCard: lleva el enlace de esta página (el compartido o el que generaría el conductor).
  const link = shared ? location.href : publicLink(config);
  function saveContact() {
    const mode = saveVCard({ ...driver, vehicle, link });
    if (mode === 'inapp') setInAppHelp(true);
    else showToast(mode === 'ios' ? 'Toca «Crear contacto nuevo»' : 'Abre el archivo descargado para guardarlo');
  }

  const pickService = (key) => { setService(key); scrollToId('cotizar'); };

  if (broken) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4">
        <Card className="text-center">
          <AlertTriangle className="mx-auto mb-2 size-8 text-tedebe" />
          <p>Este enlace está incompleto. Pídele al conductor que te lo vuelva a enviar.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-8 pb-28">
      {isPreview && (
        <Link to="/app" className="mb-5 flex items-center gap-2 rounded-2xl border border-tedebe/30 bg-tedebe/10 p-3 text-sm text-tedebe">
          <Settings className="size-4 shrink-0" /> Vista previa con tus datos. Edítala en Más → Mi página.
        </Link>
      )}

      <div className="space-y-10">
        <ProfileHeader driver={driver} vehicle={vehicle} page={page} hasWifi={!!wifi?.ssid} onSaveContact={saveContact} />

        <Section id="cotizar" title="Cotiza tu viaje" subtitle="Precio al instante, sin descargar nada.">
          <QuoteSection config={config} service={service} onService={setService} onState={onState} />
        </Section>

        <ServicesSection page={page} onPick={pickService} />
        <AmenitiesSection wifi={wifi} amenities={page.amenities} onToast={showToast} />
        <PaymentsPolicies page={page} />
      </div>

      <PublicFooter driver={driver} social={page.social} />

      {/* Barra fija al pulgar: si ya hay precio, pide el viaje; si no, lleva al cotizador. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/5 bg-asfalto/95 p-3 backdrop-blur" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + .75rem)' }}>
        <div className="mx-auto max-w-lg">
          {cta.ready && cta.href ? (
            <Button variant="whatsapp" icon={MessageCircle} className="w-full text-base" as="a" href={cta.href} target="_blank" rel="noopener">
              Solicitar este viaje · {money(cta.price)}
            </Button>
          ) : (
            <Button icon={Calculator} className="w-full text-base" onClick={() => scrollToId('cotizar')}>Cotizar mi viaje</Button>
          )}
        </div>
      </div>

      {/* Instagram/TikTok/Facebook abren la página en su navegador interno y suelen bloquear el .vcf. */}
      <Sheet open={inAppHelp} onClose={() => setInAppHelp(false)} title="Guardar el contacto">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gris">
          <li>Toca el menú <b className="text-hueso">⋯</b> (arriba a la derecha).</li>
          <li>Elige <b className="text-hueso">«Abrir en el navegador»</b> (Safari o Chrome).</li>
          <li>Ahí toca otra vez <b className="text-hueso">«Guardar contacto»</b>.</li>
        </ol>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" icon={Copy} onClick={async () => showToast((await copyText(location.href)) ? 'Enlace copiado' : 'No se pudo copiar')}>Copiar enlace</Button>
          <Button variant="outline" icon={ExternalLink} onClick={() => saveContact()}>Intentar aquí</Button>
        </div>
      </Sheet>
      {toast}
    </div>
  );
}
