"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/** Registers the service worker in production (needs HTTPS; localhost works too). */
export function ServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    if (location.protocol !== "https:" && location.hostname !== "localhost") return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}

const DISMISS_KEY = "restobar-install-dismissed";

/**
 * "Instalar en este celular": Android/Chrome uses the native prompt; iPhone gets the
 * Share → "Agregar a inicio" steps. Hidden once installed or dismissed.
 */
export function InstallPrompt({ className }: { className?: string }) {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [hidden, setHidden] = useState(true);
  const [steps, setSteps] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      dismissed = false;
    }
    if (standalone || dismissed) return;
    const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
    setIos(isIos);
    if (isIos) setHidden(false);
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
      setHidden(false);
    };
    const onInstalled = () => setHidden(true);
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (hidden) return null;
  const dismiss = () => {
    setHidden(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // Storage blocked: it will show again next time, which is fine.
    }
  };

  return (
    <div className={className} role="region" aria-label="Instalar la app">
      <div className="flex items-center gap-3 rounded-[20px] border bg-card/80 p-3 pl-4 backdrop-blur-xl">
        <Download className="size-5 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 text-[13.5px] leading-snug">
          <span className="font-semibold">Instala RestoBar OS</span>
          <span className="block text-muted-foreground">Ábrelo desde la pantalla de inicio, a pantalla completa.</span>
        </p>
        {ios ? (
          <Button size="sm" onClick={() => setSteps((s) => !s)}>
            Cómo
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={async () => {
              if (!evt) return;
              await evt.prompt();
              const choice = await evt.userChoice;
              if (choice.outcome === "accepted") setHidden(true);
              setEvt(null);
            }}
          >
            Instalar
          </Button>
        )}
        <button onClick={dismiss} aria-label="Ahora no" className="press grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary">
          <X className="size-4" />
        </button>
      </div>
      {ios && steps && (
        <ol className="mt-2 space-y-1.5 rounded-[16px] border bg-card/80 px-4 py-3 text-[13px] backdrop-blur-xl">
          <li className="flex items-center gap-2">
            1. Toca <Share className="size-4 text-primary" aria-label="Compartir" /> abajo en Safari.
          </li>
          <li>2. Elige “Agregar a inicio”.</li>
          <li>3. Toca “Agregar”. Listo: ábrelo desde tu pantalla de inicio.</li>
        </ol>
      )}
    </div>
  );
}
