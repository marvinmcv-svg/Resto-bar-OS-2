import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminShell } from "@/components/app/admin-shell";
import { Providers } from "@/components/app/providers";
import { PosFrame } from "@/components/pos/pos-frame";
import { StoreProvider } from "@/modules/pos/store";
import AdminPage from "@/app/(admin)/admin/page";
import CreditosPage from "@/app/(admin)/creditos/page";
import EquipoPage from "@/app/(admin)/equipo/page";
import KitchenPage from "@/app/(pos)/cocina/page";
import CajaPage from "@/app/(pos)/caja/page";
import EntrarPage from "@/app/entrar/page";
import MenuPage from "@/app/(admin)/menu/page";
import ResumenPage from "@/app/(admin)/resumen/page";
import FloorPage from "@/app/(pos)/pos/page";
import { OrderScreen } from "@/app/(pos)/pos/mesa/[tableId]/order-screen";
import { RouterProvider, useDemoRouter } from "./router";

function Screen() {
  const { path } = useDemoRouter();
  const mesa = path.match(/^\/pos\/mesa\/([\w-]+)$/);
  if (mesa) return <Pos><OrderScreen key={mesa[1]} tableId={mesa[1]} /></Pos>;
  if (path === "/pos") return <Pos><FloorPage /></Pos>;
  if (path === "/cocina") return <Pos><KitchenPage /></Pos>;
  if (path === "/caja") return <Pos><CajaPage /></Pos>;
  if (path === "/entrar") return <EntrarPage />;
  const pages: Record<string, () => React.ReactNode> = {
    "/admin": () => <AdminPage />,
    "/menu": () => <MenuPage />,
    "/equipo": () => <EquipoPage />,
    "/creditos": () => <CreditosPage />,
  };
  return <AdminShell>{(pages[path] ?? (() => <ResumenPage />))()}</AdminShell>;
}

function Pos({ children }: { children: React.ReactNode }) {
  return <PosFrame>{children}</PosFrame>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider initial="/entrar">
      <Providers>
        <StoreProvider>
          <Screen />
        </StoreProvider>
      </Providers>
    </RouterProvider>
  </StrictMode>,
);
