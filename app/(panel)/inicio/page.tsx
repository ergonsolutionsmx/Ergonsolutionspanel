import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus, FilePlus2, FileText, Inbox, ListPlus, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { fechaLarga } from "@/lib/utils";
import { eventosProximos, mensajesNuevos, propuestasPendientes, tareasPendientes, type GrupoPendientes } from "@/lib/inicio";
import { TarjetaPendientes } from "@/components/inicio/tarjeta-pendientes";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Inicio" };

const contar = (grupos: GrupoPendientes[], nombre: string) => grupos.find((g) => g.nombre === nombre)?.items.length ?? 0;

/** Contador del resumen: número grande + etiqueta corta; lleva a su módulo. */
function Contador({ valor, etiqueta, href, alerta = false }: { valor: number; etiqueta: string; href: string; alerta?: boolean }) {
  return (
    <Link href={href} className="group rounded-xl px-3 py-2 hover:bg-white/70">
      <span
        className={cn(
          "block text-2xl font-black tabular-nums leading-none",
          valor === 0 ? "text-ergon-navy/30" : alerta ? "text-red-600" : "text-ergon-navy",
        )}
      >
        {valor}
      </span>
      <span className="mt-1 block text-xs font-bold text-muted-foreground group-hover:text-ergon-navy">{etiqueta}</span>
    </Link>
  );
}

export default async function InicioPage() {
  const usuario = await obtenerUsuario();
  const nombre = usuario.nombre.split(" ")[0];
  const fecha = fechaLarga();

  const [tareas, eventos, mensajes, propuestas] = await Promise.all([
    tareasPendientes(),
    eventosProximos(usuario.id),
    mensajesNuevos(),
    propuestasPendientes(),
  ]);

  return (
    <>
      <section className="luz-marca mb-6 rounded-2xl border bg-card p-5 shadow-sm md:p-6" aria-label="Resumen del día">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-muted-foreground">{fecha}</p>
            <h1 className="mt-1 text-[1.75rem] font-black leading-tight tracking-tight text-ergon-navy md:text-3xl">
              Hola, {nombre}
            </h1>
          </div>
          <div className="grid w-full grid-cols-3 gap-2 sm:flex sm:w-auto">
            <Button asChild variant="outline" className="h-auto flex-col gap-1 rounded-2xl py-2.5 sm:h-10 sm:flex-row sm:rounded-full sm:py-2">
              <Link href="/proyectos/tareas/nueva?volver=%2Finicio">
                <ListPlus /> Tarea
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto flex-col gap-1 rounded-2xl py-2.5 sm:h-10 sm:flex-row sm:rounded-full sm:py-2">
              <Link href="/agenda/eventos/nuevo?volver=%2Finicio">
                <CalendarPlus /> Evento
              </Link>
            </Button>
            <Button asChild className="h-auto flex-col gap-1 rounded-2xl py-2.5 sm:h-10 sm:flex-row sm:rounded-full sm:py-2">
              <Link href="/propuestas/nueva">
                <FilePlus2 /> Propuesta
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-1 border-t pt-4 sm:grid-cols-4">
          <Contador valor={contar(tareas, "Vencidas")} etiqueta="Tareas vencidas" href="/proyectos?vista=lista&vencidas=1" alerta />
          <Contador valor={contar(eventos, "Hoy")} etiqueta="Eventos hoy" href="/agenda?vista=dia" />
          <Contador valor={contar(mensajes, "Nuevos")} etiqueta="Mensajes nuevos" href="/bandeja?estado=nuevo" />
          <Contador valor={contar(propuestas, "Vencen pronto")} etiqueta="Propuestas por vencer" href="/propuestas" alerta />
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <TarjetaPendientes titulo="Tareas" icono={ListTodo} href="/proyectos" grupos={tareas} />
        <TarjetaPendientes titulo="Agenda" icono={CalendarDays} href="/agenda" grupos={eventos} />
        <TarjetaPendientes titulo="Bandeja" icono={Inbox} href="/bandeja" grupos={mensajes} />
        <TarjetaPendientes titulo="Propuestas" icono={FileText} href="/propuestas" grupos={propuestas} />
      </div>
    </>
  );
}
