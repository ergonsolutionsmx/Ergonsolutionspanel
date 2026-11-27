import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CalendarPlus, FilePlus2, FileText, Inbox, ListPlus, ListTodo } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { fechaLarga } from "@/lib/utils";
import { eventosProximos, mensajesNuevos, propuestasPendientes, tareasPendientes } from "@/lib/inicio";
import { TarjetaPendientes } from "@/components/inicio/tarjeta-pendientes";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Inicio" };

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
      <div className="mb-5">
        <h1 className="text-2xl font-black text-ergon-navy">Hola, {nombre}</h1>
        <p className="mt-1 text-muted-foreground">{fecha}</p>
      </div>

      <div className="mb-6 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
        <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3 sm:h-10 sm:flex-row sm:py-2">
          <Link href="/proyectos/tareas/nueva?volver=%2Finicio">
            <ListPlus /> Tarea
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3 sm:h-10 sm:flex-row sm:py-2">
          <Link href="/agenda/eventos/nuevo?volver=%2Finicio">
            <CalendarPlus /> Evento
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-auto flex-col gap-1 py-3 sm:h-10 sm:flex-row sm:py-2">
          <Link href="/propuestas?nueva=propuesta">
            <FilePlus2 /> Propuesta
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <TarjetaPendientes titulo="Tareas" icono={ListTodo} href="/proyectos" grupos={tareas} />
        <TarjetaPendientes titulo="Agenda" icono={CalendarDays} href="/agenda" grupos={eventos} />
        <TarjetaPendientes titulo="Bandeja" icono={Inbox} href="/bandeja" grupos={mensajes} fase={6} />
        <TarjetaPendientes titulo="Propuestas" icono={FileText} href="/propuestas" grupos={propuestas} fase={5} />
      </div>
    </>
  );
}
