"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Popover } from "radix-ui";
import { Bell, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { haceCuanto } from "@/lib/tiempo";
import { useNotificaciones } from "./contexto";

export function Campanita({ className, lado = "bottom" }: { className?: string; lado?: "bottom" | "right" }) {
  const { notificaciones, noLeidas, cargando, marcarLeida, marcarTodas } = useNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const router = useRouter();

  const etiqueta = noLeidas > 0 ? `Notificaciones, ${noLeidas} sin leer` : "Notificaciones";

  return (
    <Popover.Root open={abierto} onOpenChange={setAbierto}>
      <Popover.Trigger
        aria-label={etiqueta}
        title={etiqueta}
        className={cn("relative rounded-md p-2 outline-none focus-visible:ring-2 focus-visible:ring-ring", className)}
      >
        <Bell className="size-5" aria-hidden />
        {noLeidas > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[11px] font-black leading-none text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        ) : null}
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side={lado}
          align={lado === "right" ? "start" : "end"}
          sideOffset={8}
          collisionPadding={8}
          className="z-50 flex max-h-[min(32rem,var(--radix-popover-content-available-height))] w-[min(24rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-lg border bg-card text-card-foreground shadow-lg"
        >
          <div className="flex items-center justify-between border-b px-4 py-3">
            <h2 className="font-black text-ergon-navy">Notificaciones</h2>
            {noLeidas > 0 ? (
              <button
                type="button"
                onClick={() => void marcarTodas()}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-sm font-bold text-primary hover:bg-accent"
              >
                <CheckCheck className="size-4" aria-hidden /> Marcar todas
              </button>
            ) : null}
          </div>

          <ul className="flex-1 overflow-y-auto">
            {cargando ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando…</li>
            ) : notificaciones.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-muted-foreground">Sin notificaciones</li>
            ) : (
              notificaciones.map((n) => (
                <li key={n.id} className="border-b last:border-b-0">
                  <button
                    type="button"
                    onClick={() => {
                      void marcarLeida(n.id);
                      if (n.link) {
                        setAbierto(false);
                        router.push(n.link);
                      }
                    }}
                    className={cn(
                      "flex w-full gap-3 px-4 py-3 text-left hover:bg-muted",
                      !n.leida && "bg-accent/60",
                    )}
                  >
                    <span
                      className={cn("mt-1.5 size-2 shrink-0 rounded-full", n.leida ? "bg-transparent" : "bg-ergon-blue")}
                      aria-hidden
                    />
                    <span className="min-w-0 flex-1">
                      <span className={cn("block text-sm", n.leida ? "font-normal" : "font-bold")}>{n.titulo}</span>
                      {n.cuerpo ? (
                        <span className="mt-0.5 block text-sm text-muted-foreground line-clamp-2">{n.cuerpo}</span>
                      ) : null}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {haceCuanto(n.creado_en)}
                        {n.leida ? "" : " · sin leer"}
                      </span>
                    </span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
