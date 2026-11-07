// Página pública (Linktree / QR del vehículo). Bloques en orden de conversión:
//   1 Perfil y contacto · 2 Cotizador · 3 Servicios y cobertura · 4 A bordo · 5 Pagos y políticas · 6 Pie
// Lee los datos del enlace (#/?c=…); sin enlace muestra la vista previa con los datos del propio conductor.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link, Navigate } from 'react-router-dom';
import { MessageCircle, Calculator, Settings, Copy, ExternalLink, AlertTriangle, X } from 'lucide-react';
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

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

export default function PublicQuote() {
  const [params] = useSearchParams();
  const store = useStore();
  const code = params.get('c');
  const shared = useMemo(() => (code ? decodeConfig(code) : null), [code]);
  const broken = !!code && !shared;
  const config = shared || store.config;
  const { driver, vehicle, page, wifi } = config;
  const isPreview = !code && params.has('vista'); // «?vista=1»: tu propia página, desde Mi página

  const [toast, showToast] = useToast();
  const [service, setService] = useState(() => SERVICES.find((s) => page.services[s.key])?.key || 'urban');
  const [cta, setCta] = useState({ ready: false, href: null, price: 0 });
  const [inAppHelp, setInAppHelp] = useState(false);
  const [bannerOff, setBannerOff] = useState(false);
  const [cotizarVisible, setCotizarVisible] = useState(false);
  const onState = useCallback((s) => setCta(s), []);

  // La barra fija solo aparece cuando ni el botón de arriba ni el cotizador están a la vista (no tapa ni repite).
  useEffect(() => {
    const els = ['pedir-cta', 'cotizar'].map((id) => document.getElementById(id));
    if (els.some((e) => !e) || !('IntersectionObserver' in window)) return undefined;
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id)));
      setCotizarVisible(seen.size > 0);
    }, { threshold: 0.2 });
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [broken]);

  useEffect(() => { document.title = driver.name ? `${driver.name} · Transporte privado` : 'Cotiza tu viaje'; }, [driver.name]);

  // vCard: lleva el enlace de esta página (el compartido o el que generaría el conductor).
  const link = shared ? location.href : publicLink(config);
  function saveContact() {
    const mode = saveVCard({ ...driver, vehicle, link });
    if (mode === 'inapp') setInAppHelp(true);
    else showToast(mode === 'ios' ? 'Toca «Crear contacto nuevo»' : 'Abre el archivo descargado para guardarlo');
  }

  const pickService = (key) => { setService(key); scrollToId('cotizar'); };

  // El link principal (sin enlace de un conductor) abre «Hoy»; los pasajeros siempre llegan con `?c=`.
  if (!code && !isPreview) return <Navigate to="/app" replace />;

  if (broken) {
    return (
      <div className="mx-auto grid min-h-dvh max-w-lg place-items-center px-4">
        <Card className="text-center">
          <AlertTriangle className="mx-auto mb-2 size-8 text-aviso" />
          <p>Este enlace está incompleto. Pídele al conductor que te lo vuelva a enviar.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-dvh max-w-lg px-4 pt-8 pb-28 md:max-w-5xl md:pb-12">
      {isPreview && !bannerOff && (
        <div className="mb-5 flex items-center gap-1 rounded-2xl border border-humo bg-tablero pl-3 text-sm">
          <Settings className="size-4 shrink-0 text-gris" aria-hidden />
          <span className="flex-1 py-2.5">Vista previa: este enlace solo funciona en tu teléfono. <button type="button" className="underline underline-offset-4" onClick={async () => showToast((await copyText(publicLink(config))) ? 'Enlace para compartir copiado' : 'No se pudo copiar')}>Copiar enlace para compartir</button> · <Link to="/app/pagina" className="underline underline-offset-4">Editar</Link></span>
          <button type="button" aria-label="Cerrar aviso" onClick={() => setBannerOff(true)} className="grid size-11 place-items-center"><X className="size-4" /></button>
        </div>
      )}

      {/* En escritorio: perfil y confianza fijos a la izquierda, cotizador y detalle a la derecha. */}
      <div className="space-y-10 md:grid md:grid-cols-[22rem_1fr] md:items-start md:gap-12 md:space-y-0">
        <div className="md:sticky md:top-6">
          <ProfileHeader driver={driver} vehicle={vehicle} page={page} hasWifi={!!wifi?.ssid} onSaveContact={saveContact} onRequest={() => scrollToId('cotizar')} />
        </div>

        <div className="space-y-10">
        <Section id="cotizar" title="Cotiza tu viaje" subtitle="Precio al instante, sin descargar nada.">
          <QuoteSection config={config} service={service} onService={setService} onState={onState} />
        </Section>

        <ServicesSection page={page} config={config} onPick={pickService} />
        <AmenitiesSection wifi={wifi} amenities={page.amenities} onToast={showToast} />
        <PaymentsPolicies page={page} />
        </div>
      </div>

      <PublicFooter driver={driver} social={page.social} />

      {/* Barra fija al pulgar: solo cuando el cotizador no está a la vista. Con precio, pide el viaje; si no, lleva al cotizador. */}
      {!cotizarVisible && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-hueso/5 bg-asfalto/95 p-3 backdrop-blur md:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + .75rem)' }}>
          <div className="mx-auto max-w-lg">
            {cta.ready && cta.href ? (
              <Button icon={MessageCircle} className="h-[52px] w-full text-base font-bold" as="a" href={cta.href} target="_blank" rel="noopener">
                Pedir con {driver.name || 'el conductor'} · {money(cta.price)}
              </Button>
            ) : (
              <Button icon={Calculator} className="h-[52px] w-full text-base font-bold" onClick={() => scrollToId('cotizar')}>Pedir mi viaje</Button>
            )}
          </div>
        </div>
      )}

      {/* Instagram/TikTok/Facebook abren la página en su navegador interno y suelen bloquear el .vcf. */}
      <Sheet open={inAppHelp} onClose={() => setInAppHelp(false)} title="Guardar el contacto">
        <ol className="list-decimal space-y-2 pl-5 text-sm text-gris">
          <li>Toca el menú <b className="text-hueso">⋯</b> (arriba a la derecha).</li>
          <li>Elige <b className="text-hueso">«Abrir en el navegador»</b> (Safari o Chrome).</li>
          <li>Ahí toca otra vez <b className="text-hueso">«Guardar contacto»</b>.</li>
        </ol>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="ghost" icon={Copy} onClick={async () => showToast((await copyText(link)) ? 'Enlace copiado' : 'No se pudo copiar')}>Copiar enlace</Button>
          <Button variant="outline" icon={ExternalLink} onClick={() => saveContact()}>Intentar aquí</Button>
        </div>
      </Sheet>
      {toast}
    </div>
  );
}
