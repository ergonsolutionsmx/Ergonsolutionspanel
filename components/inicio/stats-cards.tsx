import Link from "next/link";
import { CalendarDays, FileText, Inbox, ListTodo, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Contadores } from "@/lib/inicio";
import { Contador } from "@/components/movimiento/contador";
import { Aparece, Escalonado } from "@/components/movimiento/escalonado";

type Tarjeta = { etiqueta: string; valor: number; contexto: string; alerta?: boolean; href: string; icono: LucideIcon };

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/** Los 4 contadores del Inicio: cada uno lleva a su módulo y su número sube desde 0. */
export function StatsCards({ c }: { c: Contadores }) {
  const tarjetas: Tarjeta[] = [
    {
      etiqueta: "Tareas de hoy",
      valor: c.tareasHoy,
      contexto: c.tareasVencidas ? plural(c.tareasVencidas, "vencida", "vencidas") : "Sin vencidas",
      alerta: c.tareasVencidas > 0,
      href: c.tareasVencidas ? "/proyectos?vista=lista&vencidas=1" : "/proyectos?vista=lista",
      icono: ListTodo,
    },
    { etiqueta: "Eventos de hoy", valor: c.eventosHoy, contexto: "Ver agenda del día", href: "/agenda?vista=dia", icono: CalendarDays },
    { etiqueta: "Mensajes sin leer", valor: c.mensajesSinLeer, contexto: "En la bandeja", href: "/bandeja?estado=nuevo", icono: Inbox },
    {
      etiqueta: "Propuestas pendientes",
      valor: c.propuestasPendientes,
      contexto: c.propuestasPorVencer ? `${plural(c.propuestasPorVencer, "vence", "vencen")} pronto` : "Ninguna por vencer",
      alerta: c.propuestasPorVencer > 0,
      href: "/propuestas",
      icono: FileText,
    },
  ];
  return (
    <Escalonado className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <Aparece key={t.etiqueta}>
          <Link
            href={t.href}
            className="tarjeta-viva group flex h-full flex-col rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-5"
          >
            <span className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-muted-foreground md:text-sm">{t.etiqueta}</span>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-accent text-ergon-blue transition-transform group-hover:-rotate-6 group-hover:scale-110">
                <t.icono className="size-4" aria-hidden />
              </span>
            </span>
            <Contador
              valor={t.valor}
              className={cn("mt-2 block text-3xl font-black tabular-nums tracking-tight md:text-4xl", t.valor === 0 ? "text-ergon-navy/30" : "text-ergon-navy")}
            />
            <span className={cn("mt-1 text-xs font-bold", t.alerta ? "text-error" : "text-muted-foreground")}>{t.contexto}</span>
          </Link>
        </Aparece>
      ))}
    </Escalonado>
  );
}
