const features = [
  "El cierre del día directo en tu WhatsApp",
  "Tus meseros toman pedidos desde su celular",
  "Comandas impresas en cocina y bar",
  "Tus meseros no pueden borrar cobros ni cambiar precios",
  "La factura sale de la misma cuenta, sin volver a escribirla",
];

const guarantees = [
  "Sin contrato ni multa por cancelar",
  "Instalación y capacitación gratis en tu local",
  "30 días: si no te sirve, te devolvemos tu dinero",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wide opacity-60">Plan Fundador · Santa Cruz</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight">El sistema para tu restaurante o bar que se paga solo</h1>
      <p className="mt-4 text-lg opacity-80">
        <span className="font-semibold">Bs 350</span> al mes, todo incluido. Precio fundador para los primeros 20 locales.
      </p>
      <ul className="mt-8 space-y-2">
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <div className="mt-8 flex flex-wrap gap-3">
        <a href="/pos" className="press inline-flex h-12 items-center rounded-xl bg-primary px-6 text-[15px] font-semibold text-primary-foreground">
          Abrir la caja (demo)
        </a>
        <a href="/resumen" className="press inline-flex h-12 items-center rounded-xl border bg-card px-6 text-[15px] font-semibold">
          Ver el resumen del dueño
        </a>
      </div>
      <ul className="mt-8 space-y-2 rounded-2xl border bg-card p-5">
        {guarantees.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </main>
  );
}
