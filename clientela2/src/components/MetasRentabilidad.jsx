// Metas de rentabilidad (neto mínimo por km y por hora). Viven en Yo → Mis ganancias → Metas.
import { Target } from 'lucide-react';
import { useStore } from '../store/AppStore.jsx';
import { Card, CardTitle, Field, NumberInput } from './ui.jsx';

export default function MetasRentabilidad() {
  const { config, setSection } = useStore();
  const bind = (key) => ({ value: config.goals[key], onChange: (v) => setSection('goals', { [key]: v }) });
  return (
    <Card>
      <CardTitle icon={Target}>Metas de rentabilidad</CardTitle>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Neto mínimo por km" hint="Sobre los km que manejas."><NumberInput prefix="$" suffix="/ km" {...bind('minPerKm')} /></Field>
        <Field label="Neto mínimo por hora"><NumberInput prefix="$" suffix="/ h" {...bind('minPerHour')} /></Field>
      </div>
      <p className="mt-3 text-xs text-gris"><span className="text-ok">Verde</span> cumple ambas · <span className="text-aviso">amarillo</span> solo una · <span className="text-malo">rojo</span> ninguna.</p>
    </Card>
  );
}
