import { AppSkeleton } from "@/components/app/skeleton";
import { StoreProvider } from "@/modules/pos/store";

export const metadata = { title: "Entrar · RestoBar OS" };

export default function EntrarLayout({ children }: { children: React.ReactNode }) {
  return <StoreProvider fallback={<AppSkeleton dark />}>{children}</StoreProvider>;
}
