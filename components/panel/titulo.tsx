export function Titulo({ children, accion }: { children: React.ReactNode; accion?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-center justify-between gap-4">
      <h1 className="text-2xl font-black text-ergon-navy">{children}</h1>
      {accion}
    </div>
  );
}

/** Marcador para secciones que se construyen en fases siguientes. */
export function Pendiente({ fase }: { fase: number }) {
  return (
    <div className="rounded-lg border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
      Fase {fase}
    </div>
  );
}
