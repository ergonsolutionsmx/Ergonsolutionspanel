"use client";

import Link from "next/link";
import { useTransition } from "react";
import { Clock, ExternalLink, MapPin, Pencil, Trash2, User } from "lucide-react";
import type { ItemAgenda } from "@/lib/agenda-tipos";
import { NOMBRE_MODALIDAD } from "@/lib/agenda-tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { eliminarEvento } from "@/app/(panel)/agenda/acciones";
import { eliminarTarea } from "@/app/(panel)/proyectos/acciones";
import { COLOR_TIPO, textoHoraItem, tipoVisual } from "./colores";
import { hrefItem } from "./item";

/** Al tocar un evento o tarea: detalle con Editar / Borrar (borrar pide confirmación). Funciona con clic y en celular. */
export function DetalleItem({
  item,
  perfiles,
  volver,
  hoy,
  children,
  className,
  style,
}: {
  item: ItemAgenda;
  perfiles: PerfilCorto[];
  volver: string;
  hoy: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [borrando, startTransition] = useTransition();
  const tipo = tipoVisual(item, hoy);
  const color = COLOR_TIPO[tipo];
  const perfil = perfiles.find((p) => p.usuario_id === item.responsable_id);
  const borrar = () =>
    startTransition(async () => {
      if (item.tipo === "evento") await eliminarEvento(item.id, volver);
      else await eliminarTarea(item.id, volver);
    });

  return (
    <Popover>
      <PopoverTrigger className={cn("text-left outline-none focus-visible:ring-2 focus-visible:ring-ring", className)} style={style}>{children}</PopoverTrigger>
      <PopoverContent className="w-72 rounded-2xl p-4" align="start">
        <div className="flex items-center gap-2">
          <span className={cn("size-2.5 rounded-full", color.punto)} aria-hidden />
          <span className="text-xs font-bold text-muted-foreground">{color.nombre}</span>
        </div>
        <h3 className={cn("mt-1 font-black text-ergon-navy", tipo === "hecha" && "line-through")}>{item.titulo}</h3>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden /> {textoHoraItem(item)}
          </li>
          <li className="flex items-center gap-2">
            <User className="size-4 shrink-0" aria-hidden /> {perfil?.nombre ?? "Los dos"}
          </li>
          {item.tipo === "evento" && item.modalidad ? (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden /> {NOMBRE_MODALIDAD[item.modalidad]}
              {item.lugar ? ` · ${item.lugar}` : ""}
            </li>
          ) : item.tipo === "evento" && item.lugar ? (
            <li className="flex items-center gap-2">
              <MapPin className="size-4 shrink-0" aria-hidden /> {item.lugar}
            </li>
          ) : null}
          {item.tipo === "evento" && item.enlace ? (
            <li>
              <a href={item.enlace} target="_blank" rel="noreferrer" className="flex items-center gap-2 font-bold text-primary hover:underline">
                <ExternalLink className="size-4 shrink-0" aria-hidden /> Abrir link de la reunión
              </a>
            </li>
          ) : null}
        </ul>
        <div className="mt-4 flex gap-2">
          <Button asChild size="sm" variant="outline" className="flex-1">
            <Link href={hrefItem(item, volver)}>
              <Pencil /> Editar
            </Link>
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="ghost" className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive">
                <Trash2 /> Borrar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Borrar {item.tipo === "evento" ? "este evento" : "esta tarea"}?</AlertDialogTitle>
                <AlertDialogDescription>“{item.titulo}” se borrará para los dos. No se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={borrar} disabled={borrando}>
                  {borrando ? "Borrando…" : "Borrar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </PopoverContent>
    </Popover>
  );
}
