import { WifiOff } from "lucide-react";
import { LogoMark } from "@/components/brand/logo";

export const metadata = { title: "Sin conexión · RestoBar OS" };

/** Shown by the service worker when there's no internet and the page isn't cached. */
export default function SinConexion() {
  return (
    <main className="dark grid min-h-dvh place-items-center bg-background px-6 text-center text-foreground">
      <div className="max-w-sm">
        <LogoMark className="mx-auto size-12" />
        <span className="mx-auto mt-8 grid size-16 place-items-center rounded-[20px] bg-secondary">
          <WifiOff className="size-7 text-muted-foreground" aria-hidden />
        </span>
        <h1 className="mt-5 text-[26px] font-semibold">Sin conexión a internet</h1>
        <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">
          Conecta el internet de respaldo (el hotspot del celular o el módem 4G) y vuelve a intentar. Si sigue sin conexión, usa la libreta de
          pedidos de emergencia.
        </p>
        <a href="/entrar" className="press mt-7 inline-flex h-12 items-center rounded-full bg-primary px-6 text-[15px] font-semibold text-primary-foreground">
          Reintentar
        </a>
      </div>
    </main>
  );
}
