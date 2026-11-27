/** Bloque de ajustes: título, descripción y contenido. */
export function SeccionAjustes({ titulo, descripcion, children }: { titulo: string; descripcion?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border border-white/70 bg-card p-5 shadow-sm md:p-6">
      <h2 className="text-lg font-black text-ergon-navy">{titulo}</h2>
      {descripcion ? <p className="mt-0.5 text-sm text-muted-foreground">{descripcion}</p> : null}
      <div className="mt-5">{children}</div>
    </section>
  );
}
