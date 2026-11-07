// Piezas de UI reutilizables. Mobile-first: toques de 44–48 px, inputs de 16 px (sin zoom en iOS).
import { Minus, Plus } from 'lucide-react';

export const cx = (...c) => c.filter(Boolean).join(' ');

export function Card({ className, children, ...p }) {
  const ownPad = /(^|\s)p-\d/.test(className || ''); // si la tarjeta trae su propio padding, no se suma p-4 (los dos chocaban)
  return <section className={cx('rounded-3xl border border-hueso/5 bg-tablero', !ownPad && 'p-4', className)} {...p}>{children}</section>;
}

export function CardTitle({ icon: Icon, children, right }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      {Icon && <Icon className="size-4 text-gris" aria-hidden />}
      <h2 className="flex-1 text-xs font-semibold tracking-wide text-gris uppercase">{children}</h2>
      {right}
    </div>
  );
}

const fieldCls = 'h-12 w-full rounded-2xl border border-hueso/10 bg-asfalto px-3 text-hueso placeholder:text-gris outline-none transition focus:border-cobrado/70 focus:ring-2 focus:ring-cobrado/20';

export function Field({ label, hint, children }) {
  return (
    <label className="block">
      {label && <span className="mb-1 block text-sm text-gris">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-gris">{hint}</span>}
    </label>
  );
}

export function TextInput({ className, ...p }) {
  return <input className={cx(fieldCls, className)} {...p} />;
}

export function TextArea({ className, rows = 3, ...p }) {
  return <textarea rows={rows} className={cx(fieldCls, 'h-auto py-2.5 leading-snug', className)} {...p} />;
}

/** Input numérico con prefijo/sufijo. Devuelve número (o '' si está vacío para poder borrar). */
export function NumberInput({ value, onChange, prefix, suffix, step = 'any', className, ...p }) {
  return (
    <div className={cx('relative', className)}>
      {prefix && <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gris">{prefix}</span>}
      <input
        type="number"
        inputMode="decimal"
        step={step}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? '' : +e.target.value)}
        onFocus={(e) => e.target.select()}
        className={cx(fieldCls, 'font-mono', prefix && (String(prefix).length > 1 ? 'pl-11' : 'pl-7'), suffix && 'pr-14')}
        {...p}
      />
      {suffix && <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-gris">{suffix}</span>}
    </div>
  );
}

/** Contador − n + para pasajeros, maletas y paradas. */
export function Stepper({ label, icon: Icon, value, onChange, min = 0, max = 20 }) {
  const btn = 'grid size-10 place-items-center rounded-xl bg-asfalto text-hueso active:scale-95 disabled:opacity-30';
  return (
    <div className="flex items-center gap-2 rounded-2xl border border-hueso/10 bg-asfalto/40 p-1.5 pl-3">
      {Icon && <Icon className="size-4 text-gris" aria-hidden />}
      <span className="flex-1 truncate text-sm text-gris">{label}</span>
      <button type="button" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)} aria-label={`Menos ${label}`}><Minus className="size-4" /></button>
      <span className="w-6 text-center font-mono text-lg">{value}</span>
      <button type="button" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)} aria-label={`Más ${label}`}><Plus className="size-4" /></button>
    </div>
  );
}

const variants = {
  primary: 'bg-cobrado text-[#04210F] font-semibold',
  whatsapp: 'bg-[#25D366] text-[#04210F] font-semibold',
  ghost: 'bg-hueso/5 text-hueso',
  outline: 'border border-hueso/15 text-hueso',
  danger: 'bg-atrasado/15 text-malo',
};

export function Button({ variant = 'primary', icon: Icon, className, children, as: As = 'button', disabled, ...p }) {
  const isBtn = As === 'button';
  return (
    <As
      className={cx('inline-flex h-12 items-center justify-center gap-2 rounded-2xl px-4 text-[15px] transition active:scale-[.98]', disabled && 'pointer-events-none opacity-40', variants[variant], className)}
      {...(isBtn ? { type: 'button', disabled } : { 'aria-disabled': disabled || undefined })}
      {...p}
    >
      {Icon && <Icon className="size-5 shrink-0" aria-hidden />}
      {children}
    </As>
  );
}

/** Control segmentado (dos o más opciones). */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="grid rounded-2xl bg-asfalto p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cx('flex h-11 items-center justify-center gap-1.5 rounded-xl text-sm transition', value === v ? 'bg-tablero text-hueso shadow' : 'text-gris')}
        >
          {Icon && <Icon className="size-4" aria-hidden />}
          {label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, tone, small }) {
  const tones = { green: 'text-ok', yellow: 'text-aviso', red: 'text-malo' };
  return (
    <div className="rounded-2xl bg-asfalto/60 p-3">
      <div className="text-xs text-gris">{label}</div>
      <div className={cx('font-mono', small ? 'text-base' : 'text-xl', tones[tone] || 'text-hueso')}>{value}</div>
    </div>
  );
}

/** Mini tarjeta de contacto: inicial del cliente en hueso, con luz de estado (verde al corriente, amarillo te debe, rojo atrasado). */
export function Avatar({ name, light, className }) {
  const dot = { green: 'bg-cobrado', yellow: 'bg-tedebe', red: 'bg-atrasado' }[light];
  const initial = (String(name || '').trim()[0] || '?').toUpperCase();
  return (
    <span className={cx('relative grid size-10 shrink-0 place-items-center rounded-xl bg-hueso font-titulo text-[17px] font-bold text-asfalto', className)} aria-hidden>
      {initial}
      {dot && <i className={cx('absolute -right-[3px] -bottom-[3px] size-3 rounded-full border-2 border-tablero', dot)} />}
    </span>
  );
}
