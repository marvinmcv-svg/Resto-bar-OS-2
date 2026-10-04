export function AppSkeleton({ dark = false }: { dark?: boolean }) {
  return (
    <div className={dark ? "dark" : undefined}>
      <div className="grid min-h-dvh place-items-center bg-background" role="status" aria-label="Cargando">
        <span className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    </div>
  );
}
