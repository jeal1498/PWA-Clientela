// «Apariencia» en Ajustes: Automático (sigue al teléfono), Claro u Oscuro.
import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';
import { Card, CardTitle, Segmented } from './ui.jsx';
import { temaGuardado, guardarTema, aplicarTema, esClaro } from '../lib/tema.js';

export default function Apariencia() {
  const [tema, setTema] = useState(temaGuardado);
  const [claro, setClaro] = useState(() => esClaro());
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: light)');
    const on = () => { setClaro(esClaro()); aplicarTema(); };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const elegir = (t) => { setTema(t); guardarTema(t); setClaro(esClaro(t)); };
  return (
    <Card>
      <CardTitle icon={Palette}>Apariencia</CardTitle>
      <Segmented value={tema} onChange={elegir} options={[{ value: 'auto', label: 'Automático' }, { value: 'claro', label: 'Claro' }, { value: 'oscuro', label: 'Oscuro' }]} />
      <p className="mt-2 text-xs text-gris">{tema === 'auto' ? `Sigue el tema de tu dispositivo. Ahora: ${claro ? 'claro' : 'oscuro'}.` : `Siempre ${tema}, sin importar el dispositivo.`}</p>
    </Card>
  );
}
