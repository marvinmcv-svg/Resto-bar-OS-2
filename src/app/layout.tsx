import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Resto-bar OS",
  description: "Sistema para restaurantes y bares: pedidos, cocina, facturación SIN y cierre diario en tu WhatsApp.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">{children}</body>
    </html>
  );
}
