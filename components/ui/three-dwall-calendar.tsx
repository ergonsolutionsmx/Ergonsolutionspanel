"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Box, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ItemAgenda } from "@/lib/agenda-tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { DetalleItem } from "@/components/agenda/detalle-item";
import { COLOR_TIPO, textoHoraItem, tipoVisual } from "@/components/agenda/colores";

const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MAX_PUNTOS = 3;

type Props = {
  /** Días visibles, de lunes a domingo (incluye días de otros meses). */
  dias: string[];
  /** "YYYY-MM" del mes que se muestra. */
  mes: string;
  porDia: Record<string, ItemAgenda[]>;
  hoy: string;
  perfiles: PerfilCorto[];
  volver: string;
  hrefsDia: Record<string, string>;
  hrefNuevo: Record<string, string>;
};

function Puntos({ items, ...p }: { items: ItemAgenda[] } & Pick<Props, "hoy" | "perfiles" | "volver">) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" style={{ transform: "translateZ(20px)" }}>
      {items.slice(0, MAX_PUNTOS).map((i) => {
        const c = COLOR_TIPO[tipoVisual(i, p.hoy)];
        return (
          <DetalleItem key={`${i.tipo}-${i.id}`} item={i} {...p} className="rounded-full">
            <span
              className={cn("flex size-6 items-center justify-center rounded-full text-[10px] font-black text-white shadow-sm transition-transform hover:scale-110", c.punto)}
              title={`${c.nombre}: ${i.titulo} · ${textoHoraItem(i)}`}
            >
              {i.titulo.charAt(0).toUpperCase()}
            </span>
            <span className="sr-only">
              {c.nombre}: {i.titulo}
            </span>
          </DetalleItem>
        );
      })}
      {items.length > MAX_PUNTOS ? <span className="text-[11px] font-bold text-muted-foreground">+{items.length - MAX_PUNTOS}</span> : null}
    </div>
  );
}

/**
 * Vista Mes. Computadora: "pared" de tarjetas por día, con vista 3D opcional (se inclina al arrastrar, máx. 12°).
 * Celular: cuadrícula simple con puntos y, abajo, la lista del día seleccionado.
 */
export function CalendarioPared(props: Props) {
  const { dias, mes, porDia, hoy, hrefsDia, hrefNuevo } = props;
  const reducir = useReducedMotion();
  const [vista3d, setVista3d] = useState(false);
  const [inclinacion, setInclinacion] = useState({ x: 10, y: 0 });
  const arrastre = useRef<{ x: number; y: number; ix: number; iy: number } | null>(null);
  const [seleccionado, setSeleccionado] = useState(dias.includes(hoy) ? hoy : `${mes}-01`);
  const total = (d: string) => (porDia[d] ?? []).length;
  const resumen = dias.filter((d) => d.startsWith(mes)).reduce((s, d) => s + total(d), 0);

  return (
    <div>
      {/* ---------- Computadora ---------- */}
      <div className="hidden md:block">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {resumen === 1 ? "1 pendiente" : `${resumen} pendientes`} este mes
          </p>
          {reducir ? null : (
            <button
              type="button"
              aria-pressed={vista3d}
              onClick={() => {
                setVista3d((v) => !v);
                setInclinacion({ x: 10, y: 0 });
              }}
              className={cn(
                "flex h-9 items-center gap-1.5 rounded-full border px-3 text-sm font-bold",
                vista3d ? "border-ergon-navy bg-ergon-navy text-white" : "bg-card text-ergon-navy hover:bg-accent",
              )}
            >
              <Box className="size-4" aria-hidden /> Vista 3D
            </button>
          )}
        </div>
        <div
          style={{ perspective: 1400 }}
          className={cn(vista3d && "cursor-grab touch-none select-none active:cursor-grabbing")}
          onPointerDown={(e) => {
            if (!vista3d || (e.target as HTMLElement).closest("a,button")) return;
            arrastre.current = { x: e.clientX, y: e.clientY, ix: inclinacion.x, iy: inclinacion.y };
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const a = arrastre.current;
            if (!a) return;
            const lim = (v: number, m: number) => Math.max(-m, Math.min(m, v));
            setInclinacion({ x: lim(a.ix - (e.clientY - a.y) / 12, 12), y: lim(a.iy + (e.clientX - a.x) / 14, 10) });
          }}
          onPointerUp={() => (arrastre.current = null)}
        >
          <m.div
            animate={vista3d ? { rotateX: inclinacion.x, rotateY: inclinacion.y } : { rotateX: 0, rotateY: 0 }}
            transition={{ type: "spring", stiffness: 160, damping: 22 }}
            style={{ transformStyle: "preserve-3d", transformOrigin: "50% 60%" }}
          >
            <div className="mb-2 grid grid-cols-7 gap-2">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="px-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[repeat(7,minmax(0,1fr))] gap-2" style={{ transformStyle: "preserve-3d" }}>
              {dias.map((d, i) => {
                const fuera = !d.startsWith(mes);
                const esHoy = d === hoy;
                const items = porDia[d] ?? [];
                return (
                  <m.div
                    key={d}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.005, 0.15), duration: 0.2 }}
                    style={{ transformStyle: "preserve-3d" }}
                    className={cn(
                      "group/dia relative flex min-h-28 flex-col rounded-2xl border border-white/70 bg-card p-2.5 shadow-sm",
                      fuera && "bg-card/50 opacity-60",
                      esHoy && "ring-2 ring-ergon-blue",
                    )}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <Link
                        href={hrefsDia[d]}
                        className={cn(
                          "flex size-7 items-center justify-center rounded-full text-sm font-black hover:bg-accent",
                          esHoy ? "bg-ergon-blue text-white hover:bg-ergon-blue" : fuera ? "text-muted-foreground" : "text-ergon-navy",
                        )}
                        aria-label={`Ver el día ${Number(d.slice(8))}${items.length ? `, ${items.length} pendientes` : ""}`}
                      >
                        {Number(d.slice(8))}
                      </Link>
                      <Link
                        href={hrefNuevo[d]}
                        aria-label={`Nuevo el día ${Number(d.slice(8))}`}
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-0 hover:bg-accent hover:text-ergon-blue focus-visible:opacity-100 group-hover/dia:opacity-100"
                      >
                        <Plus className="size-4" aria-hidden />
                      </Link>
                    </div>
                    <Puntos items={items} {...props} />
                    {items.length ? (
                      <p className="mt-auto pt-2 text-[11px] text-muted-foreground">{items.length === 1 ? "1 pendiente" : `${items.length} pendientes`}</p>
                    ) : null}
                  </m.div>
                );
              })}
            </div>
          </m.div>
        </div>
        <Leyenda />
      </div>

      {/* ---------- Celular ---------- */}
      <div className="md:hidden">
        <div className="rounded-2xl border border-white/70 bg-card p-2 shadow-sm">
          <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-bold uppercase text-muted-foreground">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="py-1">
                {d.slice(0, 2)}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-1">
            {dias.map((d) => {
              const fuera = !d.startsWith(mes);
              const sel = d === seleccionado;
              const items = porDia[d] ?? [];
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => setSeleccionado(d)}
                  aria-pressed={sel}
                  aria-label={`${Number(d.slice(8))}${items.length ? `, ${items.length} pendientes` : ""}`}
                  className="flex flex-col items-center gap-0.5 rounded-xl py-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full text-sm font-bold",
                      fuera && "text-muted-foreground/60",
                      d === hoy && !sel && "text-ergon-blue",
                      sel && "bg-ergon-navy text-white",
                    )}
                  >
                    {Number(d.slice(8))}
                  </span>
                  <span className="flex h-1.5 gap-0.5" aria-hidden>
                    {items.slice(0, 3).map((i) => (
                      <span key={`${i.tipo}-${i.id}`} className={cn("size-1.5 rounded-full", COLOR_TIPO[tipoVisual(i, hoy)].punto)} />
                    ))}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <ListaDia dia={seleccionado} {...props} />
      </div>
    </div>
  );
}

function ListaDia({ dia, porDia, hoy, perfiles, volver, hrefNuevo }: { dia: string } & Props) {
  const items = porDia[dia] ?? [];
  const titulo = new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${dia}T12:00:00Z`));
  return (
    <section className="mt-4" aria-live="polite">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-black capitalize text-ergon-navy">{titulo}</h3>
        <Link href={hrefNuevo[dia] ?? "/agenda/eventos/nuevo"} className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-bold text-primary hover:bg-accent">
          <Plus className="size-4" aria-hidden /> Agregar
        </Link>
      </div>
      {items.length ? (
        <ul className="space-y-2">
          {items.map((i) => {
            const c = COLOR_TIPO[tipoVisual(i, hoy)];
            return (
              <li key={`${i.tipo}-${i.id}`}>
                <DetalleItem item={i} perfiles={perfiles} volver={volver} hoy={hoy} className={cn("flex w-full items-center gap-3 rounded-xl border-l-4 bg-card px-3 py-2.5 shadow-sm", c.borde)}>
                  <span className="min-w-0 flex-1">
                    <span className={cn("block truncate text-sm font-bold text-ergon-navy", tipoVisual(i, hoy) === "hecha" && "line-through")}>{i.titulo}</span>
                    <span className="block text-xs text-muted-foreground">
                      {c.nombre} · {textoHoraItem(i)}
                    </span>
                  </span>
                </DetalleItem>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-xl border border-dashed px-3 py-5 text-center text-sm text-muted-foreground">Nada en este día</p>
      )}
    </section>
  );
}

export function Leyenda() {
  return (
    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
      {(["evento", "reunion", "tarea", "vencida"] as const).map((t) => (
        <span key={t} className="flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", COLOR_TIPO[t].punto)} aria-hidden /> {COLOR_TIPO[t].nombre}
        </span>
      ))}
    </div>
  );
}
