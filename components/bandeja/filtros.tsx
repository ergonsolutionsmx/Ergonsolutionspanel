import Link from "next/link";
import { cn } from "@/lib/utils";
import type { FiltrosBandeja } from "@/lib/bandeja";
import { CANALES, ESTADOS_MENSAJE, NOMBRE_CANAL_CORTO, NOMBRE_ESTADO_MENSAJE } from "@/lib/inbox/tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";

export function qsBandeja(f: FiltrosBandeja, cambios: Record<string, string> = {}) {
  const p = new URLSearchParams({ canal: f.canal, estado: f.estado, asignado: f.asignado === "todos" ? "" : f.asignado, ...cambios });
  for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
  return p.toString();
}

/** Filtros por canal, estado y responsable, en chips. */
export function FiltrosBandejaChips({ f, perfiles, yoId }: { f: FiltrosBandeja; perfiles: PerfilCorto[]; yoId: string }) {
  const href = (c: Record<string, string>) => {
    const qs = qsBandeja(f, c);
    return qs ? `/bandeja?${qs}` : "/bandeja";
  };
  const chip = (activo: boolean, url: string, texto: string) => (
    <Link
      key={url + texto}
      href={url}
      aria-current={activo ? "true" : undefined}
      scroll={false}
      className={cn(
        "flex h-9 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-bold transition-colors",
        activo ? "border-ergon-navy bg-ergon-navy text-white" : "border-white/70 bg-card text-ergon-navy hover:bg-accent",
      )}
    >
      {texto}
    </Link>
  );
  const otros = perfiles.filter((p) => p.usuario_id !== yoId);
  return (
    <div className="mb-4 space-y-2">
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Canal">
        {chip(!f.canal, href({ canal: "" }), "Todos")}
        {CANALES.map((c) => chip(f.canal === c, href({ canal: c }), NOMBRE_CANAL_CORTO[c]))}
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Estado">
          {chip(!f.estado, href({ estado: "" }), "Sin archivar")}
          {ESTADOS_MENSAJE.map((e) => chip(f.estado === e, href({ estado: e }), NOMBRE_ESTADO_MENSAJE[e]))}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:ml-auto md:px-0" aria-label="Asignado">
          {chip(f.asignado === "todos", href({ asignado: "" }), "De todos")}
          {chip(f.asignado === "mios", href({ asignado: "mios" }), "Míos")}
          {otros.map((p) => chip(f.asignado === p.usuario_id, href({ asignado: p.usuario_id }), `De ${p.nombre.split(" ")[0]}`))}
          {chip(f.asignado === "sin", href({ asignado: "sin" }), "Sin asignar")}
        </div>
      </div>
    </div>
  );
}
