import { AppSkeleton } from "@/components/app/skeleton";
import { PosFrame } from "@/components/pos/pos-frame";
import { StoreProvider } from "@/modules/pos/store";

export default function PosLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider fallback={<AppSkeleton dark />}>
      <PosFrame>{children}</PosFrame>
    </StoreProvider>
  );
}
