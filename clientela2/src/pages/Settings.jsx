// Módulo A · Configuración de costos del conductor (/app/settings).
// Todo se guarda al instante en localStorage. Lo público (datos, vehículo, Wi-Fi) está en «Mi página».
import { Link } from 'react-router-dom';
import { Fuel, Wrench, Receipt, Sparkles, User, RotateCcw, ShieldAlert, ChevronRight } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { Card, CardTitle, Field, NumberInput, TextInput, Stat, Button, Segmented } from '../components/ui.jsx';
import { fuelPerKm, costPerKm } from '../lib/pricing.js';
import { money2 } from '../lib/format.js';
import CuentaCard from '../components/CuentaCard.jsx';

export default function Settings() {
  const { config, setSection, resetConfig } = useStore();
  const { costs, rates, extras, sos } = config;
  const text = (section, key) => ({ value: config[section][key], onChange: (e) => setSection(section, { [key]: e.target.value }) });
  // Atajo para enlazar un campo numérico a su sección.
  const bind = (section, key) => ({ value: config[section][key], onChange: (v) => setSection(section, { [key]: v }) });

  return (
    <>
      <h1 className="font-titulo text-2xl">Ajustes</h1>

      <CuentaCard />

      {/* Nombre, foto, WhatsApp, ciudad y Wi-Fi viven en «Mi página» (todo lo que ve el pasajero en un solo lugar). */}
      <Link to="/app/pagina" className="flex items-center gap-3 rounded-3xl border border-white/5 bg-tablero p-4">
        <User className="size-5 text-gris" />
        <span className="flex-1"><span className="block">Tus datos, vehículo, Wi-Fi y QR</span><span className="text-xs text-gris">Se editan en Yo → Mi página</span></span>
        <ChevronRight className="size-4 text-gris" />
      </Link>

      <Card>
        <CardTitle icon={Fuel}>Costos variables</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Gasolina"><NumberInput prefix="$" suffix="/ litro" {...bind('costs', 'gasPrice')} /></Field>
          <Field label="Rendimiento"><NumberInput suffix="km / l" {...bind('costs', 'kmPerLitre')} /></Field>
        </div>
        <div className="mt-4"><CardTitle icon={Wrench}>Desgaste</CardTitle></div>
        <Field label="Mantenimiento y desgaste" hint="Llantas, aceite, frenos y depreciación divididos entre los km que haces."><NumberInput prefix="$" suffix="/ km" {...bind('costs', 'wearPerKm')} /></Field>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Stat small label="Combustible por km" value={money2(fuelPerKm(costs))} />
          <Stat small label="Costo total por km" value={money2(costPerKm(costs))} tone="yellow" />
        </div>
      </Card>

      <Card>
        <CardTitle icon={Receipt}>Tarifas base</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Banderazo"><NumberInput prefix="$" {...bind('rates', 'base')} /></Field>
          <Field label="Por kilómetro"><NumberInput prefix="$" suffix="/ km" {...bind('rates', 'perKm')} /></Field>
          <Field label="Por minuto" hint="Espera o tráfico."><NumberInput prefix="$" suffix="/ min" {...bind('rates', 'perMin')} /></Field>
          <Field label="Tarifa mínima"><NumberInput prefix="$" {...bind('rates', 'minimum')} /></Field>
          <Field label="Redondear a" hint="0 = sin redondeo."><NumberInput prefix="$" {...bind('rates', 'rounding')} /></Field>
        </div>
      </Card>

      <Card>
        <CardTitle icon={Sparkles}>Recargos y adicionales</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Foráneo desde"><NumberInput suffix="km" {...bind('extras', 'foraneoKm')} /></Field>
          <Field label="Regreso vacío" hint="% de la tarifa por km."><NumberInput suffix="%" {...bind('extras', 'emptyReturnPct')} /></Field>
          <Field label="Maletas incluidas"><NumberInput suffix="pzas" step="1" {...bind('extras', 'freeBags')} /></Field>
          <Field label="Maleta extra"><NumberInput prefix="$" {...bind('extras', 'bagFee')} /></Field>
          <Field label="Parada intermedia"><NumberInput prefix="$" {...bind('extras', 'stopFee')} /></Field>
          <Field label="Caseta habitual" hint="Opcional. 0 = no se ofrece."><NumberInput prefix="$" {...bind('extras', 'tollDefault')} /></Field>
        </div>
        <p className="mt-3 text-xs text-gris">La caseta habitual se agrega con un toque; en cada viaje puedes poner otro monto.</p>
      </Card>

      <Card id="sos" className="scroll-mt-20">
        <CardTitle icon={ShieldAlert}>Seguridad (SOS)</CardTitle>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Contacto de emergencia"><TextInput {...text('sos', 'name')} placeholder="Nombre" /></Field>
            <Field label="Su teléfono"><TextInput type="tel" inputMode="tel" {...text('sos', 'phone')} placeholder="10 dígitos" /></Field>
          </div>
          <Segmented value={sos.channel} onChange={(channel) => setSection('sos', { channel })} options={[{ value: 'whatsapp', label: 'WhatsApp' }, { value: 'sms', label: 'SMS' }]} />
          <Field label="Enlace de rastreo en vivo (opcional)" hint="Ej. el enlace de «Compartir ubicación en tiempo real» de Google Maps."><TextInput type="url" {...text('sos', 'trackingLink')} placeholder="https://maps.app.goo.gl/…" /></Field>
          <p className="text-xs text-gris">Botón rojo <b className="text-atrasado">SOS</b> del encabezado: <b className="text-hueso">un toque</b> manda «Estoy iniciando un viaje en [tu ubicación]»; <b className="text-hueso">mantenlo presionado</b> para «En ruta», «Necesito ayuda» o llamar al 911. La primera vez el teléfono te pide permiso de ubicación.</p>
        </div>
      </Card>

      <Button variant="ghost" icon={RotateCcw} className="w-full" onClick={() => confirm('¿Regresar costos y tarifas a los valores sugeridos?') && resetConfig()}>
        Restaurar valores sugeridos
      </Button>
    </>
  );
}
