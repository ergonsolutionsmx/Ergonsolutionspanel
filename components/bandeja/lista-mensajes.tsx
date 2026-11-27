"use client";

import Link from "next/link";
import * as mo from "motion/react-m";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";
import { NOMBRE_ESTADO_MENSAJE, type Mensaje } from "@/lib/inbox/tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Avatar } from "@/components/tareas/etiquetas";
import { IconoCanal } from "./icono-canal";

const VARIANTE = { nuevo: "nuevo", leido: "default", respondido: "aceptada", archivado: "baja" } as const;

/** Lista de mensajes: tarjetas con canal, quién, cuándo y vista previa. */
export function ListaMensajes({
  mensajes,
  perfiles,
  hace,
  qs,
  seleccionado,
  compacta = false,
}: {
  mensajes: Mensaje[];
  perfiles: PerfilCorto[];
  /** "hace 5 min" ya calculado en el servidor, por id. */
  hace: Record<string, string>;
  /** Filtros actuales para conservarlos al abrir un mensaje. */
  qs: string;
  seleccionado?: string;
  compacta?: boolean;
}) {
  if (mensajes.length === 0)
    return <EmptyState icono={Inbox} titulo="Sin mensajes" texto="Puedes crear uno de prueba en Ajustes → Integraciones." compacto={compacta} />;
  return (
    <mo.ul className="space-y-2" variants={stagger(0.035)} initial="oculto" animate="visible">
      {mensajes.map((m) => {
        const nuevo = m.estado === "nuevo";
        const activo = m.id === seleccionado;
        return (
          <mo.li key={m.id} variants={fadeUp} layout>
            <Link
              href={`/bandeja/${m.id}${qs ? `?${qs}` : ""}`}
              aria-current={activo ? "page" : undefined}
              scroll={!compacta}
              className={cn(
                "tarjeta-viva relative flex items-start gap-3 rounded-2xl border border-white/70 bg-card p-3 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                nuevo && "bg-accent/50",
                activo && "border-ergon-blue/40 ring-2 ring-ergon-blue/30",
              )}
            >
              <IconoCanal canal={m.canal} className="size-10 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className={cn("truncate text-sm text-ergon-navy", nuevo ? "font-black" : "font-bold")}>
                    {m.remitente_nombre ?? m.remitente_contacto ?? "Sin nombre"}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">{hace[m.id]}</span>
                </div>
                {m.asunto ? <p className={cn("truncate text-sm", nuevo && "font-bold")}>{m.asunto}</p> : null}
                <p className={cn("text-sm text-muted-foreground", compacta ? "truncate" : "line-clamp-2")}>{m.cuerpo}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <Badge variant={VARIANTE[m.estado]}>{NOMBRE_ESTADO_MENSAJE[m.estado]}</Badge>
                  {m.asignado_a ? <Avatar perfil={perfiles.find((p) => p.usuario_id === m.asignado_a)} className="ml-auto size-5" /> : null}
                </div>
              </div>
              {nuevo ? <span className="absolute right-3 top-3 size-2 rounded-full bg-ergon-blue" aria-hidden /> : null}
            </Link>
          </mo.li>
        );
      })}
    </mo.ul>
  );
}
