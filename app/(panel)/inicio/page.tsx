import type { Metadata } from "next";
import { CalendarDays, FileText, Inbox, ListTodo } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { fechaLarga } from "@/lib/utils";
import { crearClienteServidor } from "@/lib/supabase/server";
import {
  contadores,
  eventosProximos,
  graficaTareas,
  mensajesNuevos,
  propuestasPendientes,
  proyectosActivos,
  tareasPendientes,
} from "@/lib/inicio";
import { agruparActividad } from "@/lib/actividad";
import type { Registro } from "@/lib/bitacora";
import { StatsCards } from "@/components/inicio/stats-cards";
import { QuickActions } from "@/components/inicio/quick-actions";
import { TarjetaPendientes } from "@/components/inicio/tarjeta-pendientes";
import { ProjectsCard } from "@/components/inicio/projects-card";
import { ActivityCard } from "@/components/inicio/activity-card";
import { GraficaFlujo } from "@/components/ui/grafica-flujo";

export const metadata: Metadata = { title: "Inicio" };

/** "Buenos días / Buenas tardes / Buenas noches" según la hora de CDMX. */
function saludo() {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

async function actividad() {
  const supabase = await crearClienteServidor();
  const [registros, perfiles] = await Promise.all([
    supabase.from("bitacora").select("id, usuario_id, accion, tabla, registro_id, detalle, creado_en").order("creado_en", { ascending: false }).limit(8),
    supabase.from("perfiles").select("usuario_id, nombre, color"),
  ]);
  return agruparActividad((registros.data ?? []) as Registro[], perfiles.data ?? []);
}

export default async function InicioPage() {
  const usuario = await obtenerUsuario();
  const nombre = usuario.nombre.split(" ")[0];

  const [c, tareas, eventos, mensajes, propuestas, grafica, proyectos, dias] = await Promise.all([
    contadores(usuario.id),
    tareasPendientes(),
    eventosProximos(usuario.id),
    mensajesNuevos(),
    propuestasPendientes(),
    graficaTareas(),
    proyectosActivos(),
    actividad(),
  ]);

  return (
    <div className="space-y-5 md:space-y-6">
      <section className="flex flex-wrap items-end justify-between gap-4" aria-label="Saludo">
        <div>
          <p className="text-sm font-bold text-muted-foreground">{fechaLarga()}</p>
          <h1 className="mt-1 text-[1.75rem] font-black leading-tight tracking-tight text-ergon-navy md:text-[2rem]">
            {saludo()}, {nombre}
          </h1>
        </div>
        <QuickActions />
      </section>

      <StatsCards c={c} />

      <div className="grid gap-4 md:grid-cols-2">
        <TarjetaPendientes titulo="Tareas" icono={ListTodo} href="/proyectos?vista=lista" grupos={tareas} />
        <TarjetaPendientes titulo="Agenda de hoy" icono={CalendarDays} href="/agenda" grupos={eventos} />
        <TarjetaPendientes titulo="Bandeja" icono={Inbox} href="/bandeja" grupos={mensajes} />
        <TarjetaPendientes titulo="Propuestas por vencer" icono={FileText} href="/propuestas" grupos={propuestas} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <section className="rounded-[1.25rem] border border-white/70 bg-card p-5 shadow-sm lg:col-span-3" aria-labelledby="grafica-tareas">
          <div className="mb-2">
            <h2 id="grafica-tareas" className="font-black text-ergon-navy">
              Tareas abiertas vs. completadas
            </h2>
            <p className="text-xs text-muted-foreground">Últimas 8 semanas</p>
          </div>
          <GraficaFlujo
            nombreA="Completadas"
            nombreB="Abiertas"
            formato="numero"
            resumen={false}
            alto={190}
            periodos={[{ id: "8s", nombre: "8 semanas", puntos: grafica.map((g) => ({ etiqueta: g.semana, a: g.completadas, b: g.abiertas })) }]}
          />
        </section>
        <div className="lg:col-span-2">
          <ProjectsCard proyectos={proyectos} />
        </div>
      </div>

      <ActivityCard dias={dias} />
    </div>
  );
}
