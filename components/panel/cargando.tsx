export function Cargando() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-4">
      <div className="h-8 w-40 animate-pulse rounded-md bg-secondary" />
      <div className="h-24 animate-pulse rounded-lg bg-secondary" />
    </div>
  );
}
