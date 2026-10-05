import { PosRail } from "./pos-rail";

/** Always-dark POS chrome: icon rail + screen. Shared by the Next layout and the panel build. */
export function PosFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="dark flex bg-background text-foreground">
      <PosRail />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
