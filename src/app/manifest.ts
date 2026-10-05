import type { MetadataRoute } from "next";

// Installable app (PWA). Opens on the sign-in screen, full screen, dark like the service screens.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/entrar",
    name: "RestoBar OS",
    short_name: "RestoBar",
    description: "Pedidos, caja, cocina, inventario y personal de tu restaurante.",
    lang: "es-BO",
    start_url: "/entrar",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: "#0b0b0d",
    theme_color: "#0b0b0d",
    categories: ["business", "food", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Salón y pedidos", url: "/pos", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Caja", url: "/caja", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Cocina", url: "/cocina", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Resumen", url: "/resumen", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
