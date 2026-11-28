"use client";

import { useOptimistic, useState, useTransition } from "react";
import * as m from "motion/react-m";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  Check,
  FileText,
  Paperclip,
  Pause,
  Pencil,
  Play,
  Plus,
  Repeat,
} from "lucide-react";
import { cn, pesos } from "@/lib/utils";
import { fechaCorta, fechaRelativa, hoyISO } from "@/lib/fechas";
import { colorCategoria, nombreCategoria, situacion, type Movimiento, type Recurrente, type TipoMovimiento } from "@/lib/finanzas-tipos";
import { cambiarRecurrente, marcarPagado } from "@/app/(panel)/finanzas/acciones";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/avisos/toast";
import { abrirMovimiento, abrirRecurrente } from "./editor";
import { abrirFactura } from "./subir-factura";

const SITUACION = {
  pagado: { texto: "Pagado", variante: "aceptada" },
  cancelado: { texto: "Cancelado", variante: "gris" },
  vencido: { texto: "Vencido", variante: "vencida" },
  hoy: { texto: "Vence hoy", variante: "ambar" },
  pendiente: { texto: "Pendiente", variante: "pendiente" },
} as const;

export function EtiquetaSituacion({ mov, hoy }: { mov: Movimiento; hoy: string }) {
  const s = SITUACION[situacion(mov, hoy)];
  return <Badge variant={s.variante}>{mov.estado === "pagado" && mov.tipo === "ingreso" ? "Cobrado" : s.texto}</Badge>;
}

/** Botones "+ Ingreso" y "+ Gasto". */
export function BotonesNuevo({ recurrente = false }: { recurrente?: boolean }) {
  const abrir = (t: TipoMovimiento) => (recurrente ? abrirRecurrente(t) : abrirMovimiento(t));
  return (
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => abrir("gasto")}>
        <Plus /> {recurrente ? "Gasto fijo" : "Gasto"}
      </Button>
      <Button onClick={() => abrir("ingreso")}>
        <Plus /> {recurrente ? "Cobro fijo" : "Ingreso"}
      </Button>
    </div>
  );
}

function IconoMovimiento({ mov }: { mov: Movimiento }) {
  const Icono = mov.tipo === "ingreso" ? ArrowDownLeft : ArrowUpRight;
  const color = colorCategoria(mov.categoria);
  return (
    <span
      className="relative grid size-10 shrink-0 place-items-center rounded-2xl text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)]"
      style={{ background: `linear-gradient(145deg, ${color}, ${color}b3)` }}
    >
      <Icono className="size-[1.05rem]" aria-hidden />
      {mov.recurrente_id ? (
        <span className="absolute -bottom-1 -right-1 grid size-4 place-items-center rounded-full bg-card text-ergon-blue ring-2 ring-card">
          <Repeat className="size-2.5" aria-hidden />
        </span>
      ) : null}
    </span>
  );
}

/** Lista de movimientos agrupada por día (inspirada en Transaction List de 21st.dev). */
export function ListaMovimientos({ movimientos }: { movimientos: Movimiento[] }) {
  const hoy = hoyISO();
  const grupos: { fecha: string; items: Movimiento[] }[] = [];
  for (const mov of movimientos) {
    const g = grupos[grupos.length - 1];
    if (g && g.fecha === mov.fecha) g.items.push(mov);
    else grupos.push({ fecha: mov.fecha, items: [mov] });
  }
  return (
    <div className="space-y-5">
      {grupos.map((g) => {
        const neto = g.items.filter((x) => x.estado !== "cancelado").reduce((s, x) => s + (x.tipo === "ingreso" ? x.total : -x.total), 0);
        return (
          <section key={g.fecha}>
            <h3 className="mb-2 flex items-center justify-between px-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <span>{fechaRelativa(g.fecha, hoy)}</span>
              <span className="tabular-nums">{neto >= 0 ? "+" : "−"}{pesos(Math.abs(neto))}</span>
            </h3>
            <ul className="overflow-hidden rounded-[1.25rem] border border-white/60 bg-card shadow-sm">
              {g.items.map((mov, i) => (
                <m.li
                  key={mov.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: Math.min(i * 0.025, 0.2), ease: [0.16, 1, 0.3, 1] }}
                  className="border-b border-ergon-navy/[0.06] last:border-b-0"
                >
                  <button
                    type="button"
                    onClick={() => abrirMovimiento(mov.tipo, mov)}
                    className="group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-ergon-navy/[0.03] focus-visible:bg-ergon-navy/[0.04] focus-visible:outline-none sm:px-4"
                  >
                    <IconoMovimiento mov={mov} />
                    <span className="min-w-0 flex-1">
                      <span className={cn("flex items-center gap-1.5 truncate font-bold text-ergon-navy", mov.estado === "cancelado" && "line-through opacity-60")}>
                        <span className="truncate">{mov.concepto}</span>
                        {mov.factura_archivo || mov.factura_folio ? <Paperclip className="size-3.5 shrink-0 text-muted-foreground" aria-label="Con factura" /> : null}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[mov.contraparte, nombreCategoria(mov.categoria)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={cn("font-black tabular-nums", mov.tipo === "ingreso" ? "text-exito" : "text-ergon-navy")}>
                        {mov.tipo === "ingreso" ? "+" : "−"}
                        {pesos(mov.total)}
                      </span>
                      <EtiquetaSituacion mov={mov} hoy={hoy} />
                    </span>
                  </button>
                </m.li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

/** Pendientes por cobrar o por pagar: tabla con estado y total abajo (inspirada en Invoice History Table de 21st.dev). */
export function TablaPendientes({ tipo, movimientos, compacto = false }: { tipo: TipoMovimiento; movimientos: Movimiento[]; compacto?: boolean }) {
  const hoy = hoyISO();
  const [lista, quitar] = useOptimistic(movimientos, (actual, id: string) => actual.filter((x) => x.id !== id));
  const [, startTransition] = useTransition();
  const total = lista.reduce((s, x) => s + x.total, 0);
  const vencido = lista.filter((x) => x.vence && x.vence < hoy).reduce((s, x) => s + x.total, 0);

  const pagar = (mov: Movimiento) =>
    startTransition(async () => {
      quitar(mov.id);
      const r = await marcarPagado(mov.id);
      if (r.ok) toast.success(tipo === "ingreso" ? "Marcado como cobrado" : "Marcado como pagado", `${mov.concepto} · ${pesos(mov.total)}`);
      else toast.error("No se pudo actualizar");
    });

  const dias = (vence: string | null) => {
    if (!vence) return "Sin fecha límite";
    const d = Math.round((new Date(`${vence}T12:00:00Z`).getTime() - new Date(`${hoy}T12:00:00Z`).getTime()) / 86_400_000);
    if (d === 0) return "Vence hoy";
    if (d < 0) return `Venció hace ${-d} día${d === -1 ? "" : "s"}`;
    return `En ${d} día${d === 1 ? "" : "s"} · ${fechaCorta(vence, hoy)}`;
  };

  const boton = (mov: Movimiento) => (
    <Button size="sm" variant="outline" onClick={() => pagar(mov)} className="shrink-0">
      <Check /> {tipo === "ingreso" ? "Cobrado" : "Pagado"}
    </Button>
  );

  if (!lista.length) {
    return (
      <p className="rounded-[1.25rem] border border-dashed border-ergon-navy/15 px-4 py-8 text-center text-sm text-muted-foreground">
        {tipo === "ingreso" ? "Nada por cobrar." : "Nada por pagar."}
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.25rem] border border-white/60 bg-card shadow-sm">
      {/* Computadora */}
      <table className={cn("hidden w-full text-sm", !compacto && "md:table")}>
        <thead>
          <tr className="border-b border-ergon-navy/[0.08] text-left text-xs font-bold uppercase tracking-wide text-muted-foreground">
            <th scope="col" className="px-4 py-3">Concepto</th>
            <th scope="col" className="px-4 py-3">{tipo === "ingreso" ? "Cliente" : "Proveedor"}</th>
            <th scope="col" className="px-4 py-3">Fecha límite</th>
            <th scope="col" className="px-4 py-3">Estado</th>
            <th scope="col" className="px-4 py-3 text-right">Monto</th>
            <th scope="col" className="w-0 px-4 py-3"><span className="sr-only">Acciones</span></th>
          </tr>
        </thead>
        <tbody>
          {lista.map((mov) => (
            <tr key={mov.id} className="border-b border-ergon-navy/[0.06] last:border-b-0 hover:bg-ergon-navy/[0.03]">
              <td className="max-w-64 px-4 py-3">
                <button type="button" onClick={() => abrirMovimiento(mov.tipo, mov)} className="flex items-center gap-1.5 text-left font-bold text-ergon-navy hover:underline">
                  <span className="truncate">{mov.concepto}</span>
                  {mov.recurrente_id ? <Repeat className="size-3.5 shrink-0 text-muted-foreground" aria-label="Recurrente" /> : null}
                </button>
              </td>
              <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">{mov.contraparte ?? "—"}</td>
              <td className={cn("whitespace-nowrap px-4 py-3 text-xs", mov.vence && mov.vence < hoy ? "font-bold text-error" : "text-muted-foreground")}>{dias(mov.vence)}</td>
              <td className="px-4 py-3">
                <EtiquetaSituacion mov={mov} hoy={hoy} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right font-black tabular-nums text-ergon-navy">{pesos(mov.total)}</td>
              <td className="px-4 py-2">
                <span className="flex items-center justify-end gap-1">
                  {mov.factura_archivo ? (
                    <button type="button" onClick={() => abrirFactura(mov.factura_archivo!)} className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-ergon-blue" aria-label="Ver factura">
                      <FileText className="size-4" aria-hidden />
                    </button>
                  ) : null}
                  {boton(mov)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-ergon-navy/[0.08] bg-ergon-navy/[0.03]">
            <td colSpan={4} className="px-4 py-3 text-sm font-bold text-muted-foreground">
              {tipo === "ingreso" ? "Total por cobrar" : "Total por pagar"}
              {vencido ? <span className="ml-2 text-error">· {pesos(vencido)} vencido</span> : null}
            </td>
            <td className="px-4 py-3 text-right text-base font-black tabular-nums text-ergon-navy">{pesos(total)}</td>
            <td />
          </tr>
        </tfoot>
      </table>

      {/* Celular */}
      <ul className={cn(!compacto && "md:hidden")}>
        {lista.map((mov) => (
          <li key={mov.id} className="flex items-center gap-3 border-b border-ergon-navy/[0.06] px-3 py-3 last:border-b-0">
            <button type="button" onClick={() => abrirMovimiento(mov.tipo, mov)} className="min-w-0 flex-1 text-left">
              <span className="block truncate font-bold text-ergon-navy">{mov.concepto}</span>
              <span className={cn("flex items-center gap-1 text-xs", mov.vence && mov.vence < hoy ? "font-bold text-error" : "text-muted-foreground")}>
                <CalendarClock className="size-3" aria-hidden /> {dias(mov.vence)}
              </span>
              <span className="mt-0.5 block font-black tabular-nums text-ergon-navy">{pesos(mov.total)}</span>
            </button>
            {boton(mov)}
          </li>
        ))}
        <li className="flex items-center justify-between bg-ergon-navy/[0.03] px-3 py-3">
          <span className="text-sm font-bold text-muted-foreground">Total</span>
          <span className="font-black tabular-nums text-ergon-navy">{pesos(total)}</span>
        </li>
      </ul>
    </div>
  );
}

/** Recurrentes: cobros y gastos fijos, con pausa/reanudar. */
export function ListaRecurrentes({ recurrentes }: { recurrentes: Recurrente[] }) {
  const [lista, cambiar] = useOptimistic(recurrentes, (actual, c: { id: string; activo: boolean }) => actual.map((r) => (r.id === c.id ? { ...r, activo: c.activo } : r)));
  const [, startTransition] = useTransition();
  const [hoy] = useState(hoyISO);
  const alternar = (r: Recurrente) =>
    startTransition(async () => {
      cambiar({ id: r.id, activo: !r.activo });
      const x = await cambiarRecurrente(r.id, !r.activo);
      if (x.ok) toast.success(r.activo ? "Recurrente en pausa" : "Recurrente activo");
      else toast.error("No se pudo actualizar");
    });
  const mensual = lista.filter((r) => r.activo).reduce((s, r) => {
    const t = r.subtotal * (1 + r.tasa_iva);
    const mes = r.frecuencia === "anual" ? t / 12 : t;
    return s + (r.tipo === "ingreso" ? mes : -mes);
  }, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Balance fijo al mes: <b className={cn("tabular-nums", mensual >= 0 ? "text-exito" : "text-ergon-navy")}>{mensual >= 0 ? "+" : "−"}{pesos(Math.abs(mensual))}</b>
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {lista.map((r) => {
          const total = r.subtotal * (1 + r.tasa_iva);
          return (
            <li key={r.id} className={cn("tarjeta-viva relative overflow-hidden rounded-[1.25rem] border border-white/60 bg-card p-4 shadow-sm", !r.activo && "opacity-60")}>
              <span className="pointer-events-none absolute -right-6 -top-8 size-24 rounded-full opacity-25 blur-2xl" style={{ background: colorCategoria(r.categoria) }} aria-hidden />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Badge variant={r.tipo === "ingreso" ? "verde" : "azul"}>{r.tipo === "ingreso" ? "Cobro" : "Gasto"} · {r.frecuencia === "anual" ? "anual" : "mensual"}</Badge>
                  <h3 className="mt-2 truncate font-black text-ergon-navy">{r.concepto}</h3>
                  <p className="truncate text-xs text-muted-foreground">{[r.contraparte, nombreCategoria(r.categoria)].filter(Boolean).join(" · ")}</p>
                </div>
                <button type="button" onClick={() => abrirRecurrente(r.tipo, r)} className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-ergon-blue" aria-label="Editar">
                  <Pencil className="size-4" aria-hidden />
                </button>
              </div>
              <div className="relative mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-xl font-black tabular-nums text-ergon-navy">{pesos(total)}</p>
                  <p className="text-xs text-muted-foreground">{r.activo ? `Próximo: ${fechaRelativa(r.proxima, hoy)}` : "En pausa"}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => alternar(r)}>
                  {r.activo ? <Pause /> : <Play />} {r.activo ? "Pausar" : "Reanudar"}
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** Actividad reciente (estilo "Recent activity" del dashboard de vidrio): ícono, concepto, estado y monto. */
export function ActividadReciente({ movimientos }: { movimientos: Movimiento[] }) {
  const hoy = hoyISO();
  if (!movimientos.length) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Aún no hay movimientos.</p>;
  }
  return (
    <ul>
      {movimientos.map((mov) => (
        <li key={mov.id} className="border-t border-ergon-navy/[0.08] first:border-t-0">
          <button
            type="button"
            onClick={() => abrirMovimiento(mov.tipo, mov)}
            className="group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ergon-navy/[0.04]"
          >
            <span
              className={cn(
                "grid size-9 shrink-0 place-items-center rounded-[0.7rem]",
                mov.tipo === "ingreso" ? "bg-ergon-sky/15 text-ergon-sky" : "bg-ergon-navy/[0.07] text-ergon-navy",
              )}
            >
              {mov.tipo === "ingreso" ? <ArrowDownLeft className="size-4" aria-hidden /> : <ArrowUpRight className="size-4" aria-hidden />}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-ergon-navy">{mov.concepto}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {nombreCategoria(mov.categoria)} · {fechaRelativa(mov.fecha, hoy)}
              </span>
            </span>
            <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
              {mov.estado === "pagado" ? <Check className="size-3" aria-hidden /> : null}
              {mov.estado === "pagado" ? (mov.tipo === "ingreso" ? "Cobrado" : "Pagado") : "Pendiente"}
            </span>
            <strong className={cn("whitespace-nowrap text-sm font-semibold tabular-nums", mov.tipo === "ingreso" ? "text-ergon-sky" : "text-ergon-navy")}>
              {mov.tipo === "ingreso" ? "+" : "−"}
              {pesos(mov.total)}
            </strong>
          </button>
        </li>
      ))}
    </ul>
  );
}
