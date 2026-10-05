import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AdminShell } from "@/components/app/admin-shell";
import { Providers } from "@/components/app/providers";
import { PosFrame } from "@/components/pos/pos-frame";
import { StoreProvider } from "@/modules/pos/store";
import CreditosPage from "@/app/(admin)/creditos/page";
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
  const page = path === "/menu" ? <MenuPage /> : path === "/creditos" ? <CreditosPage /> : <ResumenPage />;
  return <AdminShell>{page}</AdminShell>;
}

function Pos({ children }: { children: React.ReactNode }) {
  return <PosFrame>{children}</PosFrame>;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider initial="/resumen">
      <Providers>
        <StoreProvider>
          <Screen />
        </StoreProvider>
      </Providers>
    </RouterProvider>
  </StrictMode>,
);
