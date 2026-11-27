import { cn } from "@/lib/utils";
import { horaBonita } from "@/lib/fechas";
import type { ItemAgenda } from "@/lib/agenda-tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { DetalleItem } from "./detalle-item";
import { COLOR_TIPO, textoHoraItem, tipoVisual } from "./colores";

type Evento = Extract<ItemAgenda, { tipo: "evento" }>;
const PX_HORA = 52;
const aMin = (h: string) => Number(h.slice(0, 2)) * 60 + Number(h.slice(3, 5));

/** Eventos con hora: minuto de inicio y fin dentro del día. */
function conHora(items: ItemAgenda[]) {
  return items.flatMap((i) => {
    if (i.tipo !== "evento" || i.todoElDia) return [];
    if (!i.hora && !i.horaFin) return []; // ocupa todo el día (evento de varios días)
    const ini = i.hora && !i.continua ? aMin(i.hora) : 0;
    const fin = i.horaFin ? aMin(i.horaFin) : 24 * 60;
    return [{ item: i as Evento, ini, fin: Math.max(fin, ini + 30) }];
  });
}

/** Acomoda eventos que se enciman en columnas. */
function acomodar(lista: { item: Evento; ini: number; fin: number }[]) {
  const orden = [...lista].sort((a, b) => a.ini - b.ini || b.fin - a.fin);
  const salida: { item: Evento; ini: number; fin: number; col: number; cols: number }[] = [];
  let grupo: typeof salida = [];
  let finGrupo = -1;
  const cerrar = () => {
    const cols = Math.max(1, ...grupo.map((g) => g.col + 1));
    grupo.forEach((g) => salida.push({ ...g, cols }));
    grupo = [];
  };
  for (const e of orden) {
    if (e.ini >= finGrupo && grupo.length) cerrar();
    const usadas = new Set(grupo.filter((g) => g.fin > e.ini).map((g) => g.col));
    let col = 0;
    while (usadas.has(col)) col++;
    grupo.push({ ...e, col, cols: 1 });
    finGrupo = Math.max(finGrupo, e.fin);
  }
  if (grupo.length) cerrar();
  return salida;
}

/** Rango de horas visible: 7 a 21 h, ampliado si hay eventos fuera. */
export function rangoHoras(dias: ItemAgenda[][]) {
  const todos = dias.flatMap(conHora);
  const min = Math.min(7 * 60, ...todos.map((t) => t.ini));
  const max = Math.max(21 * 60, ...todos.map((t) => t.fin));
  return { desde: Math.floor(min / 60), hasta: Math.min(24, Math.ceil(max / 60)) };
}

type Comun = { perfiles: PerfilCorto[]; volver: string; hoy: string };

/** Fila de arriba: tareas y eventos de todo el día. */
export function SinHora({ items, ...p }: Comun & { items: ItemAgenda[] }) {
  const lista = items.filter((i) => i.tipo === "tarea" || i.todoElDia || (!i.hora && !i.horaFin));
  if (!lista.length) return null;
  return (
    <ul className="space-y-1">
      {lista.map((i) => {
        const c = COLOR_TIPO[tipoVisual(i, p.hoy)];
        return (
          <li key={`${i.tipo}-${i.id}`}>
            <DetalleItem item={i} {...p} className={cn("block w-full rounded-lg border-l-[3px] px-2 py-1 text-xs font-bold hover:brightness-95", c.bloque, c.borde, c.texto)}>
              <span className={cn("line-clamp-2", tipoVisual(i, p.hoy) === "hecha" && "line-through")}>
                {i.tipo === "tarea" ? "☐ " : ""}
                {i.titulo}
              </span>
            </DetalleItem>
          </li>
        );
      })}
    </ul>
  );
}

/** Columna de un día con franjas por hora. */
export function ColumnaHoras({
  items,
  desde,
  hasta,
  esHoy,
  ahoraMin,
  ...p
}: Comun & { items: ItemAgenda[]; desde: number; hasta: number; esHoy: boolean; ahoraMin: number }) {
  const eventos = acomodar(conHora(items));
  const alto = (hasta - desde) * PX_HORA;
  return (
    <div className="relative" style={{ height: alto }}>
      {Array.from({ length: hasta - desde }, (_, i) => (
        <div key={i} className="absolute inset-x-0 border-t border-dashed border-ergon-navy/10" style={{ top: i * PX_HORA }} aria-hidden />
      ))}
      {esHoy && ahoraMin >= desde * 60 && ahoraMin <= hasta * 60 ? (
        <div className="absolute inset-x-0 z-[2] flex items-center" style={{ top: ((ahoraMin - desde * 60) / 60) * PX_HORA }} aria-hidden>
          <span className="-ml-1 size-2 rounded-full bg-error" />
          <span className="h-px flex-1 bg-error" />
        </div>
      ) : null}
      {eventos.map(({ item, ini, fin, col, cols }) => {
        const c = COLOR_TIPO[tipoVisual(item, p.hoy)];
        const top = ((Math.max(ini, desde * 60) - desde * 60) / 60) * PX_HORA;
        const h = Math.max(22, ((Math.min(fin, hasta * 60) - Math.max(ini, desde * 60)) / 60) * PX_HORA - 2);
        return (
          <DetalleItem
            key={item.id}
            item={item}
            {...p}
            className={cn("absolute z-[1] overflow-hidden rounded-lg border-l-[3px] bg-card px-1.5 py-1 shadow-sm hover:z-[3]", c.borde)}
            style={{ top, height: h, left: `calc(${(col / cols) * 100}% + 2px)`, width: `calc(${100 / cols}% - 4px)` }}
          >
            <span className={cn("pointer-events-none absolute inset-0", c.bloque)} aria-hidden />
            <span className="relative block truncate text-xs font-bold text-ergon-navy">{item.titulo}</span>
            {h > 34 ? <span className="relative block truncate text-[11px] text-ergon-navy/70">{textoHoraItem(item)}</span> : null}
            <span className="sr-only">{c.nombre}</span>
          </DetalleItem>
        );
      })}
    </div>
  );
}

export { PX_HORA, horaBonita };
