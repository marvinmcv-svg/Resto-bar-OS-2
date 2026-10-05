import { redirect } from "next/navigation";

// The app opens straight into the OS; the sales page lives at /oferta.
export default function Home() {
  redirect("/resumen");
}
