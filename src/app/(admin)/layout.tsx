import { AdminShell } from "@/components/app/admin-shell";
import { AppSkeleton } from "@/components/app/skeleton";
import { StoreProvider } from "@/modules/pos/store";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider fallback={<AppSkeleton />}>
      <AdminShell>{children}</AdminShell>
    </StoreProvider>
  );
}
