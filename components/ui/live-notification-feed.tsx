"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, useReducedMotion } from "motion/react";
import * as m from "motion/react-m";
import { Bell, CalendarDays, Check, CheckCheck, FileText, Inbox, ListTodo, Trash2, X, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { gentleSpring } from "@/lib/motion";

export type TipoAviso = "message" | "calendar" | "task" | "proposal" | "info";

export type AvisoFeed = {
  id: string;
  tipo: TipoAviso;
  /** Módulo o canal ("Bandeja", "Agenda"…). */
  app: string;
  titulo: string;
  cuerpo?: string | null;
  hace: string;
  leida: boolean;
  /** Para "calendar": fecha del evento. */
  fecha?: string;
  acciones?: { etiqueta: string; id: string }[];
};

const ICONO: Record<TipoAviso, LucideIcon> = { message: Inbox, calendar: CalendarDays, task: ListTodo, proposal: FileText, info: Bell };
const ACENTO: Record<TipoAviso, string> = {
  message: "bg-ergon-blue/10 text-ergon-blue",
  calendar: "bg-ergon-sky/15 text-sky-700",
  task: "bg-aviso/10 text-amber-700",
  proposal: "bg-exito/10 text-exito",
  info: "bg-ergon-navy/[0.07] text-ergon-navy",
};

/** Mensaje: primero "escribiendo…" y luego aparecen las palabras. */
function DetalleMensaje({ texto, fresca }: { texto: string; fresca: boolean }) {
  const reducir = useReducedMotion();
  const [escribiendo, setEscribiendo] = useState(fresca && !reducir);
  useEffect(() => {
    if (!escribiendo) return;
    const t = window.setTimeout(() => setEscribiendo(false), 1000);
    return () => window.clearTimeout(t);
  }, [escribiendo]);
  return (
    <div className="mt-2 inline-block max-w-full rounded-2xl rounded-bl-md bg-muted px-3 py-2 text-[13px] leading-snug text-foreground">
      {escribiendo ? (
        <span className="flex h-[18px] items-center gap-1" aria-label="escribiendo">
          {[0, 1, 2].map((i) => (
            <m.span
              key={i}
              className="size-1.5 rounded-full bg-muted-foreground"
              animate={{ y: [0, -3, 0], opacity: [0.35, 1, 0.35] }}
              transition={{ duration: 0.76, delay: i * 0.13, repeat: 1 }}
            />
          ))}
        </span>
      ) : (
        <span className="line-clamp-3">
          {texto.split(/\s+/).map((p, i) => (
            <m.span
              key={i}
              className="inline-block"
              initial={fresca && !reducir ? { opacity: 0, y: 4, filter: "blur(2px)" } : false}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.26, delay: i * 0.04 }}
            >
              {p}&nbsp;
            </m.span>
          ))}
        </span>
      )}
    </div>
  );
}

/** Calendario: hoja con el día que "pasa" al llegar. */
function DetalleCalendario({ fecha, fresca }: { fecha: string; fresca: boolean }) {
  const d = new Date(fecha);
  const mes = new Intl.DateTimeFormat("es-MX", { month: "short", timeZone: "America/Mexico_City" }).format(d).replace(".", "");
  const dia = new Intl.DateTimeFormat("es-MX", { day: "numeric", timeZone: "America/Mexico_City" }).format(d);
  const hora = new Intl.DateTimeFormat("es-MX", { hour: "numeric", minute: "2-digit", timeZone: "America/Mexico_City" }).format(d);
  return (
    <div className="mt-2 flex items-center gap-3" style={{ perspective: 400 }}>
      <m.div
        initial={fresca ? { rotateX: -90, opacity: 0 } : false}
        animate={{ rotateX: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.25 }}
        className="w-11 overflow-hidden rounded-lg border bg-card text-center shadow-sm"
      >
        <div className="bg-error py-0.5 text-[9px] font-black uppercase text-white">{mes}</div>
        <div className="py-0.5 text-base font-black text-ergon-navy">{dia}</div>
      </m.div>
      <span className="text-xs font-bold text-muted-foreground">{hora}</span>
    </div>
  );
}

function Tarjeta({
  a,
  fresca,
  onAbrir,
  onAccion,
  onDescartar,
}: {
  a: AvisoFeed;
  fresca: boolean;
  onAbrir: () => void;
  onAccion: (id: string) => void;
  onDescartar: () => void;
}) {
  const Icono = ICONO[a.tipo];
  const [hecho, setHecho] = useState<string | null>(null);
  return (
    <m.li
      layout
      initial={fresca ? { opacity: 0, y: -16, scale: 0.96 } : { opacity: 0 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: "18%", scale: 0.98, transition: { duration: 0.22 } }}
      transition={gentleSpring}
      className="px-1 pb-2"
    >
      <article aria-label={`${a.app}: ${a.titulo}`} className={cn("group relative rounded-2xl border bg-card p-3 shadow-sm", !a.leida && "border-ergon-blue/25 bg-accent/40")}>
        <div className="flex gap-3">
          <m.span
            className={cn("grid size-9 shrink-0 place-items-center rounded-xl", ACENTO[a.tipo])}
            initial={fresca ? { scale: 0.6, rotate: -12 } : false}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 14 }}
          >
            <Icono className="size-[18px]" aria-hidden />
          </m.span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 pr-7 text-xs text-muted-foreground">
              <span className="truncate font-bold">{a.app}</span>
              <span aria-hidden>·</span>
              <span className="shrink-0 tabular-nums">{fresca ? "ahora" : a.hace}</span>
            </div>
            <button
              type="button"
              onClick={onAbrir}
              onKeyDown={(e) => {
                if (e.key === "Delete" || e.key === "Backspace") {
                  e.preventDefault();
                  onDescartar();
                }
              }}
              className={cn(
                "mt-0.5 block w-full text-left text-sm leading-snug outline-none after:absolute after:inset-0 after:rounded-2xl focus-visible:after:ring-2 focus-visible:after:ring-ring",
                a.leida ? "font-normal text-foreground" : "font-bold text-ergon-navy",
              )}
            >
              {a.titulo}
            </button>
            {a.tipo === "message" && a.cuerpo ? (
              <DetalleMensaje texto={a.cuerpo} fresca={fresca} />
            ) : a.cuerpo ? (
              <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-muted-foreground">{a.cuerpo}</p>
            ) : null}
            {a.tipo === "calendar" && a.fecha ? <DetalleCalendario fecha={a.fecha} fresca={fresca} /> : null}
            {a.acciones?.length ? (
              <div className="relative z-[1] mt-2.5 flex flex-wrap gap-2">
                {hecho ? (
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-exito/10 px-2.5 text-xs font-bold text-exito">
                    <Check className="size-3.5" aria-hidden /> {hecho}
                  </span>
                ) : (
                  a.acciones.map((ac, i) => (
                    <button
                      key={ac.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAccion(ac.id);
                        setHecho("Listo");
                      }}
                      className={cn(
                        "h-7 rounded-full px-3 text-xs font-bold outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95",
                        i === 0 ? "bg-ergon-navy text-white hover:bg-ergon-navy-2" : "border bg-card hover:bg-muted",
                      )}
                    >
                      {ac.etiqueta}
                    </button>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>
        {!a.leida ? <span aria-hidden className="absolute right-3.5 top-3.5 size-2 rounded-full bg-ergon-blue transition-opacity md:group-hover:opacity-0" /> : null}
        <button
          type="button"
          aria-label={`Descartar: ${a.titulo}`}
          onClick={(e) => {
            e.stopPropagation();
            onDescartar();
          }}
          className="absolute right-2 top-2 z-[2] grid size-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:opacity-100 max-md:top-auto max-md:bottom-2 md:opacity-0 md:group-hover:opacity-100"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </article>
    </m.li>
  );
}

/** Feed de notificaciones animado: cada tarjeta "cuenta" su noticia al llegar. */
export function LiveNotificationFeed({
  avisos,
  nuevas,
  cargando,
  onAbrir,
  onAccion,
  onDescartar,
  onLeerTodo,
  onLimpiar,
  className,
}: {
  avisos: AvisoFeed[];
  nuevas: Set<string>;
  cargando?: boolean;
  onAbrir: (a: AvisoFeed) => void;
  onAccion: (a: AvisoFeed, accionId: string) => void;
  onDescartar: (a: AvisoFeed) => void;
  onLeerTodo: () => void;
  onLimpiar: () => void;
  className?: string;
}) {
  const sinLeer = avisos.filter((a) => !a.leida).length;
  return (
    <section className={cn("flex min-h-0 flex-col", className)} aria-label="Notificaciones">
      <header className="flex items-center gap-2 px-4 pb-2 pt-3">
        <h2 className="font-black text-ergon-navy">Notificaciones</h2>
        <AnimatePresence>
          {sinLeer > 0 ? (
            <m.span
              key={sinLeer}
              initial={{ scale: 0.6 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
              className="rounded-full bg-ergon-blue px-1.5 py-0.5 text-[11px] font-black tabular-nums text-white"
            >
              {sinLeer}
            </m.span>
          ) : null}
        </AnimatePresence>
        <div className="ml-auto flex gap-1">
          {sinLeer > 0 ? (
            <button type="button" onClick={onLeerTodo} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-primary hover:bg-accent">
              <CheckCheck className="size-3.5" aria-hidden /> Leer todo
            </button>
          ) : null}
          {avisos.length > 0 ? (
            <button type="button" onClick={onLimpiar} className="flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold text-muted-foreground hover:bg-muted hover:text-foreground">
              <Trash2 className="size-3.5" aria-hidden /> Limpiar
            </button>
          ) : null}
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-1">
        {cargando ? (
          <div className="space-y-2 p-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="esqueleto h-20 rounded-2xl" />
            ))}
          </div>
        ) : avisos.length === 0 ? (
          <div className="flex flex-col items-center px-4 py-10 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-2xl bg-exito/10 text-exito">
              <CheckCheck className="size-6" aria-hidden />
            </span>
            <p className="font-bold text-ergon-navy">Estás al día</p>
            <p className="text-sm text-muted-foreground">No hay notificaciones nuevas.</p>
          </div>
        ) : (
          <ul role="list">
            <AnimatePresence initial={false}>
              {avisos.map((a) => (
                <Tarjeta
                  key={a.id}
                  a={a}
                  fresca={nuevas.has(a.id)}
                  onAbrir={() => onAbrir(a)}
                  onAccion={(id) => onAccion(a, id)}
                  onDescartar={() => onDescartar(a)}
                />
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </section>
  );
}
