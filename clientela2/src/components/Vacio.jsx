// Pantalla vacía: nunca ceros; una frase de qué sigue y un solo botón verde.
import { Link } from 'react-router-dom';
import { cx } from './ui.jsx';

const btn = 'mt-2 inline-flex h-[52px] w-full max-w-xs items-center justify-center rounded-2xl bg-cobrado px-4 text-base font-bold text-[#04210f] active:scale-[.98]';

export default function Vacio({ titulo, texto, accion, to, onClick, className }) {
  return (
    <section className={cx('flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-humo px-4 py-6 text-center', className)}>
      <b className="font-titulo text-base">{titulo}</b>
      <p className="max-w-[28ch] text-sm text-gris">{texto}</p>
      {to ? <Link to={to} className={btn}>{accion}</Link> : <button type="button" onClick={onClick} className={btn}>{accion}</button>}
    </section>
  );
}
