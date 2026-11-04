// Módulo A · Configuración de costos del conductor (/app/settings).
// Todo se guarda al instante en localStorage; no hay botón «Guardar».
import { Fuel, Wrench, Receipt, Sparkles, Target, User, RotateCcw } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { Card, CardTitle, Field, NumberInput, TextInput, Stat, Button } from '../components/ui.jsx';
import { fuelPerKm, costPerKm } from '../lib/pricing.js';
import { money2 } from '../lib/format.js';

export default function Settings() {
  const { config, setSection, resetConfig } = useStore();
  const { driver, costs, rates, extras, goals } = config;
  // Atajo para enlazar un campo numérico a su sección.
  const bind = (section, key) => ({ value: config[section][key], onChange: (v) => setSection(section, { [key]: v }) });

  return (
    <>
      <h1 className="font-titulo text-2xl">Costos y tarifas</h1>

      <Card>
        <CardTitle icon={User}>Tus datos</CardTitle>
        <div className="space-y-3">
          <Field label="Nombre que verá el cliente"><TextInput value={driver.name} onChange={(e) => setSection('driver', { name: e.target.value })} placeholder="Ej. Eduardo" /></Field>
          <div className="grid grid-cols-[80px_1fr] gap-2">
            <Field label="Lada"><TextInput inputMode="numeric" value={driver.lada} onChange={(e) => setSection('driver', { lada: e.target.value.replace(/\D/g, '') })} /></Field>
            <Field label="WhatsApp (10 dígitos)"><TextInput type="tel" inputMode="tel" value={driver.phone} onChange={(e) => setSection('driver', { phone: e.target.value })} placeholder="998 123 4567" /></Field>
          </div>
          <Field label="Ciudad base" hint="Ayuda a encontrar direcciones más rápido."><TextInput value={driver.city} onChange={(e) => setSection('driver', { city: e.target.value })} placeholder="Ej. Cancún" /></Field>
        </div>
      </Card>

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
        </div>
        <p className="mt-3 text-xs text-gris">Las casetas se capturan en cada viaje y se cobran tal cual.</p>
      </Card>

      <Card>
        <CardTitle icon={Target}>Metas de rentabilidad</CardTitle>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Neto mínimo por km" hint="Sobre los km que manejas."><NumberInput prefix="$" suffix="/ km" {...bind('goals', 'minPerKm')} /></Field>
          <Field label="Neto mínimo por hora"><NumberInput prefix="$" suffix="/ h" {...bind('goals', 'minPerHour')} /></Field>
        </div>
        <p className="mt-3 text-xs text-gris"><span className="text-cobrado">Verde</span> cumple ambas · <span className="text-tedebe">amarillo</span> solo una · <span className="text-atrasado">rojo</span> ninguna.</p>
      </Card>

      <Button variant="ghost" icon={RotateCcw} className="w-full" onClick={() => confirm('¿Regresar costos y tarifas a los valores sugeridos?') && resetConfig()}>
        Restaurar valores sugeridos
      </Button>
    </>
  );
}
