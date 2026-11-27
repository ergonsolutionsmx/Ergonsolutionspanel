import Link from "next/link";
import { Circle, CircleCheck, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { horaBonita } from "@/lib/fechas";
import type { ItemAgenda } from "@/lib/agenda-tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { Avatar } from "@/components/tareas/etiquetas";

export function hrefItem(item: ItemAgenda, volver: string) {
  const v = encodeURIComponent(volver);
  return item.tipo === "tarea" ? `/proyectos/tareas/${item.id}?volver=${v}` : `/agenda/eventos/${item.id}?volver=${v}`;
}

function textoHora(item: Extract<ItemAgenda, { tipo: "evento" }>) {
  if (item.todoElDia) return "Todo el día";
  if (item.continua && !item.horaFin) return "Continúa";
  if (item.continua && item.horaFin) return `Hasta ${horaBonita(item.horaFin)}`;
  if (item.hora && item.horaFin && item.horaFin !== item.hora) return `${horaBonita(item.hora)} – ${horaBonita(item.horaFin)}`;
  return item.hora ? horaBonita(item.hora) : "";
}

/** Renglón completo (vistas Día, Semana y Lista). */
export function ItemAgendaFila({
  item,
  volver,
  hoy,
  perfiles,
  compacta = false,
}: {
  item: ItemAgenda;
  volver: string;
  hoy: string;
  perfiles: PerfilCorto[];
  /** Columnas angostas (semana en computadora): el título puede usar 2 renglones, sin iniciales. */
  compacta?: boolean;
}) {
  const perfil = perfiles.find((p) => p.usuario_id === item.responsable_id);
  const tituloCls = compacta ? "md:line-clamp-2 md:whitespace-normal md:break-words" : "";
  const avatarCls = compacta ? "md:hidden" : "";

  if (item.tipo === "tarea") {
    const hecha = item.estado === "hecha";
    const vencida = !hecha && item.dia < hoy;
    return (
      <Link
        href={hrefItem(item, volver)}
        className={cn(
          "flex items-center gap-2 rounded-md border border-dashed bg-card px-3 py-2 hover:border-ergon-blue",
          compacta && "md:items-start md:px-2",
          vencida && "border-red-300",
        )}
      >
        {hecha ? (
          <CircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <Circle className={cn("mt-0.5 size-4 shrink-0 text-muted-foreground", vencida && "text-red-600")} aria-hidden />
        )}
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-sm font-bold",
            tituloCls,
            hecha && "text-muted-foreground line-through",
            vencida && "text-red-700",
          )}
        >
          {item.titulo}
        </span>
        <span className="sr-only">(tarea)</span>
        <Avatar perfil={perfil} className={avatarCls} />
      </Link>
    );
  }

  return (
    <Link
      href={hrefItem(item, volver)}
      className={cn(
        "flex items-center gap-2 rounded-md border-l-4 border-ergon-blue bg-blue-50 px-3 py-2 hover:bg-blue-100",
        compacta && "md:px-2",
      )}
    >
      <span className="min-w-0 flex-1">
        <span className={cn("block truncate text-sm font-bold text-ergon-navy", tituloCls)}>{item.titulo}</span>
        <span className="flex flex-wrap items-center gap-x-2 text-xs text-ergon-navy/70">
          <span>{textoHora(item)}</span>
          {item.lugar ? (
            <span className={cn("flex min-w-0 items-center gap-0.5 truncate", compacta && "md:hidden")}>
              <MapPin className="size-3 shrink-0" aria-hidden />
              {item.lugar}
            </span>
          ) : null}
        </span>
      </span>
      {item.responsable_id ? <Avatar perfil={perfil} className={avatarCls} /> : null}
    </Link>
  );
}

/** Versión mínima para la cuadrícula del mes. */
export function ItemAgendaMini({ item, volver, hoy }: { item: ItemAgenda; volver: string; hoy: string }) {
  if (item.tipo === "tarea") {
    const hecha = item.estado === "hecha";
    const vencida = !hecha && item.dia < hoy;
    return (
      <Link
        href={hrefItem(item, volver)}
        className={cn(
          "flex items-center gap-1 truncate rounded border border-dashed px-1 text-[11px] leading-5 hover:border-ergon-blue",
          hecha && "text-muted-foreground line-through",
          vencida && "border-red-300 text-red-700",
        )}
        title={`Tarea: ${item.titulo}`}
      >
        <Circle className="size-2.5 shrink-0" aria-hidden />
        <span className="truncate">{item.titulo}</span>
      </Link>
    );
  }
  return (
    <Link
      href={hrefItem(item, volver)}
      className="block truncate rounded bg-blue-100 px-1 text-[11px] font-bold leading-5 text-ergon-navy hover:bg-blue-200"
      title={item.titulo}
    >
      {item.hora && !item.continua ? `${item.hora} ` : ""}
      {item.titulo}
    </Link>
  );
}
