import { AppSkeleton } from "@/components/app/skeleton";
import { StoreProvider } from "@/modules/pos/store";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark bg-background text-foreground">
      <StoreProvider fallback={<AppSkeleton dark />}>{children}</StoreProvider>
    </div>
  );
}
