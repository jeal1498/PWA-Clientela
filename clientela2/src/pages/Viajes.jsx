// «Viajes»: el recorrido de un viaje de izquierda a derecha: Propuestas → Por hacer → Hechos.
import { useSearchParams } from 'react-router-dom';
import { Segmented } from '../components/ui.jsx';
import Agenda from './Agenda.jsx';
import History from './History.jsx';
import Bitacora from './Bitacora.jsx';

const SECCIONES = [
  { value: 'propuestas', label: 'Propuestas' },
  { value: 'porhacer', label: 'Por hacer' },
  { value: 'hechos', label: 'Hechos' },
];

export default function Viajes() {
  const [params, setParams] = useSearchParams();
  const s = SECCIONES.some((x) => x.value === params.get('s')) ? params.get('s') : 'porhacer';
  return (
    <>
      <h1 className="font-titulo text-2xl">Viajes</h1>
      <Segmented options={SECCIONES} value={s} onChange={(v) => setParams({ s: v }, { replace: true })} />
      {s === 'propuestas' && <History embedded />}
      {s === 'porhacer' && <Agenda embedded />}
      {s === 'hechos' && <Bitacora embedded />}
    </>
  );
}
