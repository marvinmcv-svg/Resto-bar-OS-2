import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BellRing, Check, ChefHat, FileCheck2, MessageCircle, ShieldCheck, Smartphone, Sparkles, Users, X,
} from "lucide-react";
import { LogoMark } from "@/components/brand/logo";
import { DemoVideo } from "@/components/landing/demo-video";
import { Button } from "@/components/ui/button";
import { demoRequestHref } from "@/modules/marketing/contact";
import { ROLE_LABEL, ROLE_SUMMARY } from "@/modules/pos/permissions";
import type { Role } from "@/modules/pos/types";

export const metadata: Metadata = {
  title: "RestoBar OS · El sistema operativo de tu restaurante",
  description:
    "Pedidos desde el celular del mesero, pantalla de cocina, permisos por rol, factura SIN y el cierre del día en tu WhatsApp. Sin contrato, Bs 350 al mes.",
};

const PILLARS = [
  { icon: Smartphone, title: "Meseros con su celular", text: "Sin comprar tablets. Cada uno entra con su PIN." },
  { icon: ChefHat, title: "Cocina y barra al instante", text: "Comanda impresa o en pantalla, con tiempos." },
  { icon: ShieldCheck, title: "Nadie borra una venta", text: "Anular pide PIN del encargado y queda registrado." },
  { icon: MessageCircle, title: "Tu cierre en WhatsApp", text: "Ventas, anulaciones y caja, cada noche. Desde noviembre." },
];

const FEATURES = [
  {
    eyebrow: "Para tus meseros",
    title: "Toman el pedido en la mesa. Desde su propio celular.",
    text: "Fotos, precios y opciones claras. El sistema sugiere la bebida o el postre que falta, como los sistemas grandes: más ticket promedio sin presionar a nadie.",
    points: ["Funciona en Android y iPhone, en el navegador", "Sugerencias automáticas en cada pedido", "Notas del cliente: cumpleaños, alergias"],
    image: "/landing/phone-order.jpg",
    phone: true,
  },
  {
    eyebrow: "Para tu cocina y tu barra",
    title: "Cada comanda llega a su estación, con reloj.",
    text: "La cocina ve sus platos, la barra sus tragos. Marcan “listo” y el mesero lo ve en su celular. Si algo se acaba, lo marcan agotado y desaparece de todas las pantallas.",
    points: ["Comandas impresas en cocina y barra", "Pantalla de cocina con tiempos en rojo", "Agotados al instante en todo el local"],
    image: "/landing/kitchen.jpg",
  },
  {
    eyebrow: "Para tu cajero",
    title: "Su propia caja: abre, cobra y cierra cuadrado.",
    text: "Abre el turno contando el efectivo, ve qué mesas piden la cuenta y cobra en un toque. Cada salida de dinero pide el PIN del encargado. Al cerrar, cuenta billetes y el sistema dice si sobra o falta.",
    points: ["Arqueo por billetes y monedas", "Entradas y salidas con nombre y aprobación", "Diferencias de caja en tu resumen"],
    image: "/landing/caja.jpg",
  },
  {
    eyebrow: "Tu personal",
    title: "Horarios, asistencia y propinas, sin cuaderno.",
    text: "Cada persona marca entrada y salida con su PIN. Ves quién llegó tarde, quién faltó y cuántas horas trabajó. Repartes las propinas por horas en segundos y exportas todo para tu contador.",
    points: ["Horario semanal y copiar la semana anterior", "Atrasos y faltas automáticos", "Reparto de propinas y exportación para el contador"],
    image: "/landing/attendance.jpg",
  },
  {
    eyebrow: "Para ti, el dueño",
    title: "Sabes cómo va el día sin estar en el local.",
    text: "Ventas por hora, lo más vendido, cómo te pagaron, anulaciones y caja esperada. Y cada noche, el cierre completo en tu WhatsApp.",
    points: ["Resumen en vivo desde cualquier celular", "Anulaciones con nombre, motivo y quién aprobó", "Cierre diario en tu WhatsApp (noviembre)"],
    image: "/landing/dashboard.jpg",
  },
  {
    eyebrow: "Tu menú",
    title: "Cambias un precio en segundos. Llega a todos al instante.",
    text: "Agrega platos con foto, quita los que ya no van, crea categorías y decide si salen por cocina o por barra. Lo que quitas se guarda para tus reportes.",
    points: ["Agregar, editar y quitar productos", "Categorías por estación", "Productos destacados y agotados"],
    image: "/landing/menu-editor.jpg",
  },
];

const TEAM: Role[] = ["owner", "manager", "cashier", "waiter", "bartender", "kitchen"];

const COMPARE: { row: string; them: string; us: string }[] = [
  { row: "Contrato", them: "2 a 3 años, con multa por salir", us: "Mes a mes. Cancelas con un WhatsApp" },
  { row: "Costo real", them: "Módulos aparte: USD 150-300 al mes", us: "Bs 350 al mes, todo incluido" },
  { row: "Cobros", them: "Te obligan a usar su procesador de tarjetas", us: "Sigues con tu QR y tu POS de siempre" },
  { row: "Equipos", them: "Hardware propio por cada terminal", us: "Los celulares de tu equipo + 1 impresora" },
  { row: "Soporte", them: "Call center, esperas largas en fin de semana", us: "WhatsApp de 11:00 a 24:00, todos los días" },
  { row: "Factura SIN", them: "No disponible en Bolivia", us: "Sale de la misma cuenta, sin volver a escribir (noviembre)" },
  { row: "Instalación", them: "Semanas", us: "Una visita a tu local, con capacitación" },
];

const ROADMAP = [
  {
    when: "Hoy",
    items: ["Pedidos desde el celular", "Comandas en cocina y barra", "Roles y PINs", "Menú y agotados", "Caja con arqueo", "Asistencia y propinas"],
  },
  { when: "Noviembre 2026", items: ["Factura SIN integrada", "Cierre diario en WhatsApp", "Dividir cuentas y propinas"] },
  { when: "Diciembre 2026", items: ["Menú QR", "Inventario básico y costo de recetas"] },
  { when: "Enero 2027", items: ["Modo sin internet", "Reportes semanales"] },
];

const FAQ = [
  { q: "Ya tengo sistema. ¿Por qué cambiar?", a: "¿Te manda el cierre a WhatsApp y evita que un mesero borre ventas? Pruébalo 30 días: si no te sirve, te devolvemos tu dinero." },
  { q: "¿Tengo que comprar tablets?", a: "No. Tus meseros usan su propio celular. Solo necesitas una impresora térmica para la cocina y un equipo Android para la caja." },
  { q: "¿Y si se cae el internet?", a: "El día de la instalación configuramos una conexión de respaldo con tu celular o un módem 4G. Cambia en segundos. Si todo falla, imprimes la libreta de pedidos de emergencia." },
  { q: "Ya facturo gratis con el SIN.", a: "Sí, pero alguien vuelve a escribir cada venta. Desde noviembre, aquí la factura sale de la misma cuenta, en un toque." },
  { q: "¿Y si ustedes desaparecen?", a: "No hay contrato y puedes exportar tus datos cuando quieras. Si cancelas, te los entregamos en 48 horas." },
  { q: "¿Cuánto tarda la instalación?", a: "Una visita de unas 3 horas: cargamos tu menú, configuramos la impresora, creamos los PINs y hacemos un servicio de prueba con tu equipo." },
];

export default function LandingPage() {
  const demoHref = demoRequestHref();
  const external = demoHref.startsWith("http");

  return (
    <div className="bg-background text-foreground">
      <header className="glass sticky top-0 z-40 border-b">
        <nav className="mx-auto flex h-16 max-w-[1120px] items-center justify-between gap-4 px-4 sm:px-6" aria-label="Principal">
          <Link href="/" className="flex items-center gap-2.5" aria-label="RestoBar OS, inicio">
            <LogoMark />
            <span className="text-[15px] font-semibold tracking-[-0.01em]">RestoBar OS</span>
          </Link>
          <div className="hidden items-center gap-7 text-[14px] text-muted-foreground md:flex">
            <a href="#funciones" className="hover:text-foreground">Funciones</a>
            <a href="#equipo" className="hover:text-foreground">Roles</a>
            <a href="#precio" className="hover:text-foreground">Precio</a>
            <a href="#preguntas" className="hover:text-foreground">Preguntas</a>
          </div>
          <Button asChild size="sm">
            <Link href="/entrar">Probar demo</Link>
          </Button>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div aria-hidden className="pointer-events-none absolute -top-48 left-1/2 size-[900px] -translate-x-1/2 rounded-full bg-primary/12 blur-[160px]" />
          <div className="relative mx-auto max-w-[1120px] px-4 pt-16 pb-10 text-center sm:px-6 sm:pt-24">
            <p className="animate-enter mx-auto inline-flex items-center gap-2 rounded-full border bg-card px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground shadow-card">
              <span className="size-1.5 rounded-full bg-primary" aria-hidden /> Hecho en Santa Cruz para restaurantes y bares de Bolivia
            </p>
            <h1 className="animate-enter mx-auto mt-6 max-w-[860px] text-[44px] leading-[1.02] font-semibold tracking-[-0.035em] text-balance sm:text-[68px]">
              Tu restaurante, bajo control. Desde tu celular.
            </h1>
            <p className="animate-enter mx-auto mt-6 max-w-[620px] text-[18px] leading-relaxed text-muted-foreground text-pretty sm:text-[20px]">
              Pedidos desde el celular del mesero, cocina al instante, permisos por rol y el cierre del día en tu WhatsApp. Sin contrato.
            </p>
            <div className="animate-enter mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="xl" className="px-7">
                <Link href={demoHref} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
                  Agenda una demo en tu local <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="px-7">
                <Link href="/entrar">Probar el sistema ahora</Link>
              </Button>
            </div>
            <p className="mt-4 text-[13px] text-muted-foreground">Bs 350 al mes · Instalación gratis · 30 días de garantía</p>
          </div>
          <div className="relative mx-auto max-w-[1120px] px-4 pb-20 sm:px-6">
            <div className="animate-enter overflow-hidden rounded-[28px] border bg-black shadow-float ring-1 ring-black/5">
              <DemoVideo src="/landing/demo.mp4" poster="/landing/demo-poster.jpg" label="Video: un servicio completo en RestoBar OS, del pedido al cierre" />
            </div>
          </div>
        </section>

        {/* Pillars */}
        <section className="border-y bg-card" aria-label="Lo esencial">
          <ul className="mx-auto grid max-w-[1120px] gap-px sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex gap-3.5 px-6 py-7">
                <span className="grid size-10 shrink-0 place-items-center rounded-[12px] bg-ember-soft text-primary">
                  <Icon className="size-5" aria-hidden />
                </span>
                <span>
                  <span className="block text-[15px] font-semibold">{title}</span>
                  <span className="mt-1 block text-[14px] leading-relaxed text-muted-foreground">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Features */}
        <section id="funciones" className="mx-auto max-w-[1120px] scroll-mt-20 space-y-28 px-4 py-24 sm:px-6 sm:py-32">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="grid items-center gap-10 lg:grid-cols-12 lg:gap-14">
              <div className={i % 2 ? "lg:order-2 lg:col-span-5" : "lg:col-span-5"}>
                <p className="text-[14px] font-semibold text-primary">{f.eyebrow}</p>
                <h2 className="mt-3 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-[42px]">{f.title}</h2>
                <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">{f.text}</p>
                <ul className="mt-6 space-y-2.5">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2.5 text-[15px]">
                      <Check className="size-[18px] shrink-0 text-primary" aria-hidden /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className={i % 2 ? "lg:order-1 lg:col-span-7" : "lg:col-span-7"}>
                {f.phone ? (
                  <div className="relative mx-auto grid max-w-[560px] place-items-center rounded-[32px] bg-gradient-to-br from-secondary to-ember-soft py-10">
                    <div className="overflow-hidden rounded-[44px] border-[10px] border-foreground/90 shadow-float">
                      <Image src={f.image} alt="Pantalla del pedido en el celular del mesero" width={300} height={650} className="h-auto w-[260px] sm:w-[300px]" />
                    </div>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-[22px] border bg-card shadow-float">
                    <Image src={f.image} alt={f.title} width={1440} height={900} className="h-auto w-full" sizes="(min-width:1024px) 640px, 100vw" />
                  </div>
                )}
              </div>
            </article>
          ))}
        </section>

        {/* Roles */}
        <section id="equipo" className="dark scroll-mt-16 bg-background py-24 text-foreground sm:py-32">
          <div className="mx-auto max-w-[1120px] px-4 sm:px-6">
            <div className="mx-auto max-w-[720px] text-center">
              <p className="text-[14px] font-semibold text-primary">Roles y permisos</p>
              <h2 className="mt-3 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-[48px]">
                Cada uno ve lo suyo. Nadie toca lo que no le corresponde.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
                Cada persona entra con su PIN. Un mesero no puede cobrar, cambiar precios ni borrar una venta. Y no es solo la pantalla: la base de
                datos lo impide.
              </p>
            </div>
            <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {TEAM.map((r) => (
                <li key={r} className="rounded-[22px] border bg-card p-6">
                  <Users className="size-5 text-primary" aria-hidden />
                  <h3 className="mt-4 text-[17px] font-semibold">{ROLE_LABEL[r]}</h3>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{ROLE_SUMMARY[r]}</p>
                </li>
              ))}
            </ul>
            <div className="mt-10 overflow-hidden rounded-[22px] border shadow-float">
              <Image src="/landing/team.jpg" alt="Pantalla de equipo y permisos" width={1440} height={900} className="h-auto w-full" sizes="(min-width:1120px) 1072px, 100vw" />
            </div>
          </div>
        </section>

        {/* Comparison */}
        <section className="mx-auto max-w-[1120px] px-4 py-24 sm:px-6 sm:py-32" aria-labelledby="compare-title">
          <div className="mx-auto max-w-[760px] text-center">
            <p className="text-[14px] font-semibold text-primary">Lo mejor de los grandes, sin sus problemas</p>
            <h2 id="compare-title" className="mt-3 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-[48px]">
              Lo que hace líder a Toast en EE.UU., pensado para Bolivia.
            </h2>
            <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
              Estudiamos por qué miles de restaurantes eligen los sistemas grandes y de qué se quejan. Tomamos lo bueno y quitamos lo que duele.
            </p>
          </div>
          <div className="mt-12 overflow-x-auto rounded-[22px] border bg-card shadow-card">
            <table className="w-full min-w-[640px] text-left text-[15px]">
              <thead>
                <tr className="border-b">
                  <th scope="col" className="w-[22%] px-6 py-4 text-[13px] font-medium text-muted-foreground">
                    <span className="sr-only">Tema</span>
                  </th>
                  <th scope="col" className="px-6 py-4 text-[13px] font-semibold text-muted-foreground">Sistemas grandes de EE.UU.</th>
                  <th scope="col" className="bg-ember-soft/60 px-6 py-4 text-[13px] font-semibold text-primary">RestoBar OS</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((c) => (
                  <tr key={c.row} className="border-b last:border-0">
                    <th scope="row" className="px-6 py-4 font-semibold">{c.row}</th>
                    <td className="px-6 py-4 text-muted-foreground">
                      <span className="flex items-start gap-2">
                        <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/60" aria-hidden /> {c.them}
                      </span>
                    </td>
                    <td className="bg-ember-soft/40 px-6 py-4 font-medium">
                      <span className="flex items-start gap-2">
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /> {c.us}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-center text-[12px] text-muted-foreground">
            Según reseñas públicas de Toast POS en 2026 (POSUSA, Capterra, Forbes Advisor). Toast es marca de Toast, Inc. y no opera en Bolivia.
          </p>
        </section>

        {/* Pricing */}
        <section id="precio" className="scroll-mt-16 border-t bg-card py-24 sm:py-32">
          <div className="mx-auto grid max-w-[1120px] items-center gap-12 px-4 sm:px-6 lg:grid-cols-2">
            <div>
              <p className="text-[14px] font-semibold text-primary">Plan Fundador</p>
              <h2 className="mt-3 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] text-balance sm:text-[48px]">
                Un plan. Un precio. Todo incluido.
              </h2>
              <p className="mt-5 text-[17px] leading-relaxed text-muted-foreground">
                Solo 20 lugares con precio fundador: Bs 350 congelado por 24 meses y después 30% de descuento para siempre.
              </p>
              <ul className="mt-7 space-y-3">
                {[
                  "Instalación y capacitación gratis en tu local",
                  "Sin contrato ni multa por cancelar",
                  "30 días: si no te sirve, te devolvemos tu dinero",
                  "Soporte por WhatsApp de 11:00 a 24:00",
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2.5 text-[15px]">
                    <ShieldCheck className="size-[18px] shrink-0 text-primary" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[28px] border bg-background p-8 shadow-float sm:p-10">
              <p className="text-[15px] font-semibold">Plan Fundador</p>
              <p className="mt-4 flex items-baseline gap-2">
                <span className="text-[56px] leading-none font-semibold tracking-[-0.04em] tabular">Bs 350</span>
                <span className="text-[16px] text-muted-foreground">/ mes por local</span>
              </p>
              <p className="mt-2 text-[14px] text-muted-foreground">o Bs 3.500 al año: pagas 10 meses, usas 12.</p>
              <ul className="mt-7 space-y-2.5 border-t pt-7 text-[15px]">
                {[
                  "Pedidos, mesas y cuentas ilimitadas",
                  "Caja con arqueo, asistencia y propinas",
                  "Usuarios y celulares sin límite",
                  "Pantalla de cocina y comandas",
                  "Roles, PINs y control de anulaciones",
                  "Factura SIN, hasta 2.000 al mes (noviembre)",
                  "Cierre diario en tu WhatsApp (noviembre)",
                ].map((p) => (
                  <li key={p} className="flex items-center gap-2.5">
                    <Check className="size-[18px] shrink-0 text-primary" aria-hidden /> {p}
                  </li>
                ))}
              </ul>
              <Button asChild size="xl" className="mt-8 w-full">
                <Link href={demoHref} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
                  Quiero mi lugar fundador <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Roadmap */}
        <section className="mx-auto max-w-[1120px] px-4 py-24 sm:px-6 sm:py-32" aria-labelledby="roadmap-title">
          <div className="max-w-[640px]">
            <p className="text-[14px] font-semibold text-primary">Qué viene</p>
            <h2 id="roadmap-title" className="mt-3 text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-[42px]">
              Sin promesas vacías. Con fechas.
            </h2>
          </div>
          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ROADMAP.map((r, i) => (
              <li key={r.when} className="rounded-[22px] border bg-card p-6 shadow-card">
                <p className="flex items-center gap-2 text-[14px] font-semibold">
                  {i === 0 ? <BellRing className="size-4 text-primary" aria-hidden /> : <Sparkles className="size-4 text-muted-foreground" aria-hidden />}
                  {r.when}
                </p>
                <ul className="mt-4 space-y-2 text-[14px] text-muted-foreground">
                  {r.items.map((it) => (
                    <li key={it} className="flex gap-2">
                      <span className={i === 0 ? "text-primary" : ""} aria-hidden>•</span> {it}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        {/* FAQ */}
        <section id="preguntas" className="scroll-mt-16 border-t bg-card py-24 sm:py-32">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            <h2 className="text-center text-[32px] leading-[1.08] font-semibold tracking-[-0.03em] sm:text-[42px]">Preguntas de dueños</h2>
            <div className="mt-12 divide-y rounded-[22px] border bg-background">
              {FAQ.map((f) => (
                <details key={f.q} className="group px-6 py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[16px] font-semibold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-secondary text-muted-foreground transition-transform group-open:rotate-45" aria-hidden>
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="dark bg-background py-24 text-center text-foreground sm:py-32">
          <div className="mx-auto max-w-[760px] px-4 sm:px-6">
            <FileCheck2 className="mx-auto size-9 text-primary" aria-hidden />
            <h2 className="mt-6 text-[34px] leading-[1.06] font-semibold tracking-[-0.03em] text-balance sm:text-[52px]">
              Míralo funcionando en tu local esta semana.
            </h2>
            <p className="mx-auto mt-5 max-w-[540px] text-[17px] leading-relaxed text-muted-foreground">
              15 minutos. Te mostramos un pedido de punta a punta y te mandamos un cierre de ejemplo a tu WhatsApp.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Button asChild size="xl" className="px-7">
                <Link href={demoHref} {...(external ? { target: "_blank", rel: "noopener" } : {})}>
                  Agenda tu demo <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="px-7">
                <Link href="/entrar">Probar el sistema ahora</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4 px-4 py-8 text-[13px] text-muted-foreground sm:px-6">
          <span className="flex items-center gap-2">
            <LogoMark className="size-7 rounded-[9px]" /> RestoBar OS · Santa Cruz, Bolivia
          </span>
          <span className="flex gap-5">
            <Link href="/entrar" className="hover:text-foreground">Entrar</Link>
            <Link href="/creditos" className="hover:text-foreground">Créditos de fotos</Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
