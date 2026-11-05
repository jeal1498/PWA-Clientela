// Encabezado de sección de la landing: título corto + subtítulo opcional.
export default function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="scroll-mt-4">
      <h2 className="font-titulo text-xl">{title}</h2>
      {subtitle && <p className="mt-0.5 text-sm text-gris">{subtitle}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}
