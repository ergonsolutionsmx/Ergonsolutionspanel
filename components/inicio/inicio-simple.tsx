import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CircleCheck,
  FileText,
  FolderKanban,
  HandCoins,
  Inbox,
  ListTodo,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn, pesos } from "@/lib/utils";
import { fechaCorta } from "@/lib/fechas";
import { ETAPAS_METODO, NOMBRE_ETAPA, type EtapaMetodo } from "@/lib/tareas-tipos";
import type { PendienteHoy, ResumenInicio, TrabajoEnCurso } from "@/lib/inicio";
import { Iniciales } from "@/components/panel/usuario";
import { EmptyState } from "@/components/ui/empty-state";

const tarjeta = "rounded-[1.1rem] bg-card shadow-sm";
const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Un dato por sección; cada tarjeta lleva a su sección. */
export function ResumenSecciones({ r }: { r: ResumenInicio }) {
  const items: { nombre: string; valor: string; detalle: string; alerta?: boolean; href: string; icono: LucideIcon; clase?: string }[] = [
    {
      nombre: "Tareas de hoy",
      valor: String(r.tareasHoy),
      detalle: r.tareasVencidas ? plural(r.tareasVencidas, "vencida", "vencidas") : "Sin vencidas",
      alerta: r.tareasVencidas > 0,
      href: "/proyectos?vista=lista",
      icono: ListTodo,
    },
    {
      nombre: "Agenda",
      valor: String(r.eventosHoy),
      detalle: r.proximoEvento ? `${r.proximoEvento.cuando}: ${r.proximoEvento.titulo}` : "Sin eventos próximos",
      href: "/agenda",
      icono: CalendarDays,
    },
    { nombre: "Bandeja", valor: String(r.mensajes), detalle: r.mensajes ? "Sin leer" : "Todo leído", href: "/bandeja", icono: Inbox },
    {
      nombre: "Propuestas",
      valor: String(r.propuestas),
      detalle: r.propuestasPorVencer ? `${plural(r.propuestasPorVencer, "vence", "vencen")} pronto` : "Pendientes",
      alerta: r.propuestasPorVencer > 0,
      href: "/propuestas",
      icono: FileText,
    },
    {
      nombre: "Finanzas del mes",
      valor: pesos(r.utilidadMes).replace(/\.00$/, ""),
      detalle: r.cobrosVencidos ? `${pesos(r.cobrosVencidos).replace(/\.00$/, "")} por cobrar vencido` : `Por cobrar ${pesos(r.porCobrar).replace(/\.00$/, "")}`,
      alerta: r.cobrosVencidos > 0,
      href: "/finanzas",
      icono: Wallet,
      clase: "col-span-2 sm:col-span-1",
    },
  ];
  return (
    <section aria-label="Resumen" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {items.map((i) => (
        <Link
          key={i.nombre}
          href={i.href}
          className={cn(tarjeta, "tarjeta-viva group flex min-w-0 flex-col p-4 outline-none focus-visible:ring-2 focus-visible:ring-ring", i.clase)}
        >
          <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            {i.nombre}
            <i.icono className="size-4 shrink-0 opacity-70 transition-transform group-hover:scale-110" aria-hidden />
          </span>
          <strong className="mt-1.5 truncate text-[1.6rem] font-semibold leading-tight tracking-tight tabular-nums text-ergon-navy">{i.valor}</strong>
          <span className={cn("mt-1 truncate text-xs", i.alerta ? "font-semibold text-error" : "text-muted-foreground")}>{i.detalle}</span>
        </Link>
      ))}
    </section>
  );
}

const ICONO_PENDIENTE: Record<PendienteHoy["tipo"], LucideIcon> = { evento: CalendarDays, tarea: ListTodo, cobro: HandCoins, pago: Receipt };

/** Lo que hay que atender hoy: eventos, tareas, cobros y pagos. */
export function PendientesHoy({ items }: { items: PendienteHoy[] }) {
  return (
    <section className={cn(tarjeta, "p-4 md:p-5")} aria-labelledby="pendientes-hoy">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="pendientes-hoy" className="text-sm font-semibold text-ergon-navy">
          Pendientes de hoy
        </h2>
        {items.length ? <span className="rounded-full bg-ergon-navy/[0.07] px-2 py-0.5 text-xs font-semibold tabular-nums text-ergon-navy">{items.length}</span> : null}
      </div>
      {items.length ? (
        <ul>
          {items.slice(0, 10).map((p) => {
            const Icono = ICONO_PENDIENTE[p.tipo];
            return (
              <li key={p.id} className="border-t border-ergon-navy/[0.08] first:border-t-0">
                <Link href={p.href} className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-ergon-navy/[0.04]">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-[0.7rem]", p.urgente ? "bg-error/12 text-error" : "bg-ergon-navy/[0.07] text-ergon-navy")}>
                    <Icono className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-ergon-navy">{p.titulo}</span>
                    <span className={cn("block truncate text-xs", p.urgente ? "font-semibold text-error" : "text-muted-foreground")}>{p.detalle}</span>
                  </span>
                </Link>
              </li>
            );
          })}
          {items.length > 10 ? <li className="pt-2 text-xs text-muted-foreground">y {items.length - 10} más</li> : null}
        </ul>
      ) : (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <CircleCheck className="size-5 text-exito" aria-hidden /> Nada pendiente para hoy.
        </p>
      )}
    </section>
  );
}

/** Trabajos activos y la fase en la que se quedaron. */
export function TrabajosEnCurso({ trabajos }: { trabajos: TrabajoEnCurso[] }) {
  return (
    <section className={cn(tarjeta, "p-4 md:p-5")} aria-labelledby="trabajos">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="trabajos" className="text-sm font-semibold text-ergon-navy">
          Trabajos en curso
        </h2>
        <Link href="/proyectos?vista=proyectos" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-ergon-sky">
          Ver todo <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
      {trabajos.length ? (
        <ul className="space-y-3">
          {trabajos.map((t) => {
            const idx = Math.max(0, ETAPAS_METODO.indexOf((t.etapa ?? "analisis") as EtapaMetodo));
            const fase = NOMBRE_ETAPA[ETAPAS_METODO[idx]];
            return (
              <li key={t.id}>
                <Link href={`/proyectos/${t.id}`} className="block rounded-2xl bg-ergon-navy/[0.035] p-3.5 transition-colors hover:bg-ergon-navy/[0.06]">
                  <span className="flex items-start justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ergon-navy">{t.nombre}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[t.cliente, t.fechaObjetivo ? `Entrega ${fechaCorta(t.fechaObjetivo)}` : null, t.total ? `${t.hechas}/${t.total} tareas` : null]
                          .filter(Boolean)
                          .join(" · ") || "Sin detalles"}
                      </span>
                    </span>
                    {t.responsable ? (
                      <span title={t.responsable.nombre}>
                        <Iniciales nombre={t.responsable.nombre} color={t.responsable.color} className="size-7 text-[11px]" />
                      </span>
                    ) : null}
                  </span>

                  {/* Trayectoria: en qué fase nos quedamos */}
                  <span className="mt-3 flex items-center gap-1" aria-label={`Fase: ${fase} (${idx + 1} de ${ETAPAS_METODO.length})`}>
                    {ETAPAS_METODO.map((e, i) => (
                      <span
                        key={e}
                        className={cn(
                          "h-1.5 flex-1 rounded-full",
                          i < idx ? "bg-ergon-sky" : i === idx ? "bg-ergon-sky shadow-[0_0_10px_var(--ergon-sky)]" : "bg-ergon-navy/[0.1]",
                        )}
                      />
                    ))}
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-ergon-sky">
                      {fase} <span className="font-normal text-muted-foreground">· fase {idx + 1} de {ETAPAS_METODO.length}</span>
                    </span>
                    {t.siguiente ? <span className="min-w-0 truncate text-muted-foreground">Sigue: {t.siguiente}</span> : null}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState compacto icono={FolderKanban} titulo="Sin trabajos activos" texto="Crea un proyecto y aquí verás en qué fase va." />
      )}
    </section>
  );
}
