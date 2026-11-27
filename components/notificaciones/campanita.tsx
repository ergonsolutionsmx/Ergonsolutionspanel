"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Popover } from "radix-ui";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { haceCuanto } from "@/lib/tiempo";
import { useHidratado } from "@/lib/use-hidratado";
import { useMedia } from "@/lib/use-media";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { LiveNotificationFeed, type AvisoFeed, type TipoAviso } from "@/components/ui/live-notification-feed";
import { toast } from "@/components/avisos/toast";
import { cambiarEstadoTarea } from "@/app/(panel)/proyectos/acciones";
import { useNotificaciones, type Notificacion } from "./contexto";

const TAREA = /^\/proyectos\/tareas\/([0-9a-f-]{36})/i;

function aAviso(n: Notificacion): AvisoFeed {
  const prefijo = n.tipo.split("_")[0];
  const tipo: TipoAviso =
    prefijo === "mensaje" ? "message" : prefijo === "tarea" ? "task" : prefijo === "propuesta" ? "proposal" : prefijo === "evento" || prefijo === "reunion" ? "calendar" : "info";
  const app = { message: "Bandeja", task: "Tareas", proposal: "Propuestas", calendar: "Agenda", info: "Ergon" }[tipo];
  const esTarea = tipo === "task" && TAREA.test(n.link ?? "");
  return {
    id: n.id,
    tipo,
    app,
    titulo: n.titulo,
    cuerpo: n.cuerpo,
    hace: haceCuanto(n.creado_en),
    leida: n.leida,
    acciones: esTarea ? [{ etiqueta: "Marcar hecha", id: "hecha" }] : undefined,
  };
}

export function Campanita({ className }: { className?: string; lado?: "bottom" | "right" }) {
  const { notificaciones, noLeidas: noLeidasReales, cargando, marcarLeida, marcarTodas, descartar, limpiar, nuevas, pulso } = useNotificaciones();
  // El servidor siempre dibuja la campana en cero: el número aparece ya hidratado.
  const hidratado = useHidratado();
  const escritorio = useMedia("(min-width: 768px)");
  const noLeidas = hidratado ? noLeidasReales : 0;
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();
  const etiqueta = noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones";
  const porId = new Map(notificaciones.map((n) => [n.id, n]));

  const feed = (
    <LiveNotificationFeed
      avisos={notificaciones.map(aAviso)}
      nuevas={nuevas}
      cargando={cargando}
      className={escritorio ? "max-h-[min(34rem,calc(100dvh-7rem))]" : "h-full"}
      onAbrir={(a) => {
        void marcarLeida(a.id);
        const link = porId.get(a.id)?.link;
        if (link) {
          setAbierto(false);
          router.push(link);
        }
      }}
      onAccion={async (a, accion) => {
        const id = porId.get(a.id)?.link?.match(TAREA)?.[1];
        if (accion === "hecha" && id) {
          await cambiarEstadoTarea(id, "hecha");
          void marcarLeida(a.id);
          toast.success("Tarea marcada como hecha");
        }
      }}
      onDescartar={(a) => void descartar(a.id)}
      onLeerTodo={() => void marcarTodas()}
      onLimpiar={() => void limpiar()}
    />
  );

  const boton = (
    <motion.span
      key={pulso}
      className="relative flex"
      animate={pulso > 0 ? { rotate: [0, -14, 12, -8, 6, 0] } : undefined}
      transition={{ duration: 0.6 }}
    >
      <Bell className="size-5" aria-hidden />
      {noLeidas > 0 ? (
        <motion.span
          key={noLeidas}
          initial={{ scale: 0.5 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 14 }}
          className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[11px] font-black leading-none text-white ring-2 ring-white"
        >
          {noLeidas > 99 ? "99+" : noLeidas}
        </motion.span>
      ) : null}
    </motion.span>
  );

  const claseBoton = cn("relative rounded-full p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring", className);

  if (!escritorio) {
    return (
      <>
        <button type="button" aria-label={etiqueta} title={etiqueta} className={claseBoton} onClick={() => setAbierto(true)}>
          {boton}
        </button>
        <Sheet open={abierto} onOpenChange={setAbierto}>
          <SheetContent side="right" className="w-full max-w-none border-0 p-0 pt-[env(safe-area-inset-top)] sm:max-w-md">
            <SheetTitle className="sr-only">Notificaciones</SheetTitle>
            <SheetDescription className="sr-only">Tus avisos recientes</SheetDescription>
            <div className="flex h-full flex-col pt-10">{feed}</div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger aria-label={etiqueta} title={etiqueta} className={claseBoton}>
        {boton}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="bottom"
          align="end"
          sideOffset={10}
          collisionPadding={8}
          className="vidrio-solido z-50 w-[min(26rem,calc(100vw-1rem))] overflow-hidden rounded-3xl text-card-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
        >
          {feed}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
