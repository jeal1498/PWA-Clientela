// «Mis ganancias»: Resumen, Gastos y Metas en una sola pantalla (Yo → Mis ganancias).
import { useSearchParams, Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { Segmented } from '../components/ui.jsx';
import MetasRentabilidad from '../components/MetasRentabilidad.jsx';
import Resumen from './Resumen.jsx';
import Gastos from './Gastos.jsx';

const SECCIONES = [
  { value: 'resumen', label: 'Resumen' },
  { value: 'gastos', label: 'Gastos' },
  { value: 'metas', label: 'Metas' },
];

export default function Ganancias() {
  const [params, setParams] = useSearchParams();
  const s = SECCIONES.some((x) => x.value === params.get('s')) ? params.get('s') : 'resumen';
  return (
    <>
      <Link to="/app/yo" className="inline-flex min-h-11 items-center gap-1 text-sm text-ok"><ChevronLeft className="size-4" aria-hidden /> Yo</Link>
      <h1 className="font-titulo text-2xl">Mis ganancias</h1>
      <Segmented options={SECCIONES} value={s} onChange={(v) => setParams({ s: v }, { replace: true })} />
      {s === 'resumen' && <Resumen embedded />}
      {s === 'gastos' && <Gastos embedded />}
      {s === 'metas' && <MetasRentabilidad />}
    </>
  );
}
