const features = [
  "Pedidos por mesa, comandas a cocina y bar",
  "Facturación al SIN desde la caja",
  "Cierre del día directo en tu WhatsApp",
  "Sigue vendiendo aunque se caiga el internet",
  "Funciona en cualquier tablet, celular o PC",
];

const guarantees = [
  "Sin contrato ni multa por cancelar",
  "Instalación y capacitación gratis en tu local",
  "30 días: si no te sirve, no pagas",
];

export default function Home() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <p className="text-sm font-medium uppercase tracking-wide opacity-60">Plan Fundador · Santa Cruz</p>
      <h1 className="mt-2 text-4xl font-bold leading-tight">El sistema para tu restaurante o bar que se paga solo</h1>
      <p className="mt-4 text-lg opacity-80">
        <span className="font-semibold">Bs 350</span> al mes, todo incluido. Precio de por vida para los primeros 20 locales.
      </p>
      <ul className="mt-8 space-y-2">
        {features.map((f) => (
          <li key={f}>✓ {f}</li>
        ))}
      </ul>
      <ul className="mt-8 space-y-2 rounded-lg border border-current/20 p-4">
        {guarantees.map((g) => (
          <li key={g}>{g}</li>
        ))}
      </ul>
    </main>
  );
}
