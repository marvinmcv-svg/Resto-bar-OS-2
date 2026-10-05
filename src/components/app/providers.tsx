"use client";

import { usePathname } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ServiceWorker } from "./pwa";

const DARK = ["/pos", "/cocina", "/caja", "/entrar"];

/** The POS always runs dark (dim bars at night, less glare); the back office follows the owner's choice. */
export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
      forcedTheme={DARK.some((p) => pathname.startsWith(p)) ? "dark" : undefined}
    >
      <TooltipProvider delayDuration={300}>
        {children}
        <Toaster position="top-center" />
        <ServiceWorker />
      </TooltipProvider>
    </ThemeProvider>
  );
}
