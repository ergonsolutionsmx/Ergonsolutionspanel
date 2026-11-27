import type { Metadata } from "next";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { ESTADOS_TAREA, type EstadoTarea } from "@/lib/tareas-tipos";
import { EventScheduler } from "@/components/ui/event-scheduler";
import { Titulo } from "@/components/panel/titulo";

export const metadata: Metadata = { title: "Nueva tarea" };

export default async function NuevaTareaPage({ searchParams }: PageProps<"/proyectos/tareas/nueva">) {
  const usuario = await obtenerUsuario();
  const sp = await searchParams;
  const catalogos = await obtenerCatalogos(usuario.id);
  const volver = rutaSegura(sp.volver, "/proyectos");
  const proyecto = typeof sp.proyecto === "string" && catalogos.proyectos.some((p) => p.id === sp.proyecto) ? sp.proyecto : null;
  const fecha = typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : "";
  const estado = (ESTADOS_TAREA as readonly string[]).includes(String(sp.estado)) ? (sp.estado as EstadoTarea) : "por_hacer";

  return (
    <div className="max-w-2xl">
      <Titulo>Nueva tarea</Titulo>
      <div className="rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm md:p-6">
        <EventScheduler modoInicial="tarea" catalogos={catalogos} fecha={fecha} volver={volver} proyectoId={proyecto} estadoInicial={estado} />
      </div>
    </div>
  );
}
