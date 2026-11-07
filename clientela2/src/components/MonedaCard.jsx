// «Moneda» en Ajustes: pesos por defecto; otras monedas de Latinoamérica, dólar y euro.
// Se guarda en config.currency (viaja a la nube con el resto de la configuración y al enlace público).
import { Coins } from 'lucide-react';
import { Card, CardTitle, Field } from './ui.jsx';
import { useStore } from '../store/AppStore.jsx';
import { MONEDAS, MONEDA_MXN, money, rate } from '../lib/moneda.js';

export default function MonedaCard() {
  const { config, setSection } = useStore();
  const code = config.currency?.code || 'MXN';
  const elegir = (e) => {
    const m = MONEDAS.find((x) => x.code === e.target.value) || MONEDA_MXN;
    const { name, ...c } = m;
    setSection('currency', c);
  };
  return (
    <Card>
      <CardTitle icon={Coins}>Moneda</CardTitle>
      <Field label="Moneda de tus precios" hint="Cambia el símbolo y los separadores en toda la app y en tu página pública. No convierte los montos.">
        <select
          value={code}
          onChange={elegir}
          className="h-12 w-full rounded-2xl border border-hueso/10 bg-asfalto px-3 text-hueso outline-none transition focus:border-cobrado/70 focus:ring-2 focus:ring-cobrado/20"
        >
          {MONEDAS.map((m) => <option key={m.code} value={m.code}>{`${m.name} (${m.code}) ${m.sym}`}</option>)}
        </select>
      </Field>
      <p className="mt-2 text-xs text-gris">Así se ve: <b className="font-mono text-hueso">{money(1250)}</b> · <b className="font-mono text-hueso">{rate(9.5)}</b> por km</p>
    </Card>
  );
}
