import Link from "next/link";
import { cn } from "@/lib/utils";
import { diaCorto, diaLargo, mayuscula, rangoDias, sumarDias } from "@/lib/fechas";
import type { ItemAgenda } from "@/lib/agenda-tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { ItemAgendaFila, ItemAgendaMini } from "./item";

type Comun = {
  porDia: Record<string, ItemAgenda[]>;
  volver: string;
  hoy: string;
  perfiles: PerfilCorto[];
  /** Arma la URL de la agenda con otros parámetros (p. ej. ir a un día). */
  hrefDia: (fecha: string) => string;
};

function Vacio({ texto = "Nada en este día" }: { texto?: string }) {
  return <p className="rounded-md border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">{texto}</p>;
}

function ListaDelDia({ items, ...p }: Omit<Comun, "porDia" | "hrefDia"> & { items: ItemAgenda[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={`${item.tipo}-${item.id}`}>
          <ItemAgendaFila item={item} {...p} />
        </li>
      ))}
    </ul>
  );
}

export function VistaDia({ fecha, ...p }: Comun & { fecha: string }) {
  const items = p.porDia[fecha] ?? [];
  return items.length ? <ListaDelDia items={items} volver={p.volver} hoy={p.hoy} perfiles={p.perfiles} /> : <Vacio />;
}

export function VistaSemana({ desde, ...p }: Comun & { desde: string }) {
  const dias = rangoDias(desde, sumarDias(desde, 6));
  return (
    <div className="grid gap-3 md:grid-cols-7 md:gap-2">
      {dias.map((dia) => {
        const items = p.porDia[dia] ?? [];
        const esHoy = dia === p.hoy;
        return (
          <section key={dia} aria-label={mayuscula(diaLargo(dia))} className={cn("rounded-lg border border-white/70 bg-card p-2", esHoy && "border-ergon-blue ring-1 ring-ergon-blue")}>
            <Link href={p.hrefDia(dia)} className="mb-2 flex items-baseline gap-2 rounded px-1 hover:bg-muted md:flex-col md:items-start md:gap-0">
              <span className="text-xs font-bold uppercase text-muted-foreground">{diaCorto(dia).replace(".", "")}</span>
              <span className={cn("text-lg font-black", esHoy ? "text-ergon-blue" : "text-ergon-navy")}>{Number(dia.slice(8))}</span>
            </Link>
            {items.length ? (
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={`${item.tipo}-${item.id}`}>
                    <ItemAgendaFila item={item} volver={p.volver} hoy={p.hoy} perfiles={p.perfiles} compacta />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="px-1 pb-1 text-xs text-muted-foreground md:hidden">—</p>
            )}
          </section>
        );
      })}
    </div>
  );
}

const MAX_EN_CELDA = 3;

export function VistaMes({ desde, hasta, mes, ...p }: Comun & { desde: string; hasta: string; mes: string }) {
  const dias = rangoDias(desde, hasta);
  const encabezados = dias.slice(0, 7).map((d) => diaCorto(d).replace(".", ""));
  return (
    <div className="overflow-hidden rounded-lg border border-white/70 bg-card">
      <div className="grid grid-cols-7 border-b bg-muted text-center text-xs font-bold uppercase text-muted-foreground">
        {encabezados.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {dias.map((dia) => {
          const items = p.porDia[dia] ?? [];
          const fuera = dia.slice(0, 7) !== mes;
          const esHoy = dia === p.hoy;
          return (
            <div key={dia} className={cn("min-h-16 border-b border-r p-1 md:min-h-28", fuera && "bg-muted/50")}>
              <Link
                href={p.hrefDia(dia)}
                aria-label={`${mayuscula(diaLargo(dia))}${items.length ? `, ${items.length} pendientes` : ""}`}
                className={cn(
                  "mb-1 flex size-7 items-center justify-center rounded-full text-sm font-bold hover:bg-accent",
                  fuera && "text-muted-foreground",
                  esHoy && "bg-ergon-blue text-white hover:bg-ergon-blue",
                )}
              >
                {Number(dia.slice(8))}
              </Link>
              {/* Celular: puntitos. Computadora: títulos. */}
              {items.length ? (
                <Link href={p.hrefDia(dia)} className="flex flex-wrap gap-0.5 px-1 md:hidden" aria-hidden tabIndex={-1}>
                  {items.slice(0, 4).map((item) => (
                    <span
                      key={`${item.tipo}-${item.id}`}
                      className={cn("size-1.5 rounded-full", item.tipo === "evento" ? "bg-ergon-blue" : "border border-muted-foreground")}
                    />
                  ))}
                </Link>
              ) : null}
              <ul className="hidden space-y-0.5 md:block">
                {items.slice(0, MAX_EN_CELDA).map((item) => (
                  <li key={`${item.tipo}-${item.id}`}>
                    <ItemAgendaMini item={item} volver={p.volver} hoy={p.hoy} />
                  </li>
                ))}
                {items.length > MAX_EN_CELDA ? (
                  <li>
                    <Link href={p.hrefDia(dia)} className="px-1 text-[11px] font-bold text-primary hover:underline">
                      +{items.length - MAX_EN_CELDA} más
                    </Link>
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function VistaLista({ desde, hasta, ...p }: Comun & { desde: string; hasta: string }) {
  const dias = rangoDias(desde, hasta).filter((d) => p.porDia[d]?.length);
  if (!dias.length) return <Vacio texto="Nada en los próximos días" />;
  return (
    <div className="space-y-5">
      {dias.map((dia) => (
        <section key={dia} aria-label={mayuscula(diaLargo(dia))}>
          <h2 className="mb-2 text-sm font-black text-ergon-navy">
            <Link href={p.hrefDia(dia)} className="hover:underline">
              {dia === p.hoy ? "Hoy · " : dia === sumarDias(p.hoy, 1) ? "Mañana · " : ""}
              {mayuscula(diaLargo(dia))}
            </Link>
          </h2>
          <ListaDelDia items={p.porDia[dia]} volver={p.volver} hoy={p.hoy} perfiles={p.perfiles} />
        </section>
      ))}
    </div>
  );
}
