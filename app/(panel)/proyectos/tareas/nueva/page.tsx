import type { Metadata } from "next";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { FormularioTarea } from "@/components/tareas/formulario-tarea";
import { Titulo } from "@/components/panel/titulo";
import { crearTarea } from "../../acciones";

export const metadata: Metadata = { title: "Nueva tarea" };

export default async function NuevaTareaPage({ searchParams }: PageProps<"/proyectos/tareas/nueva">) {
  const usuario = await obtenerUsuario();
  const sp = await searchParams;
  const catalogos = await obtenerCatalogos(usuario.id);
  const volver = rutaSegura(sp.volver, "/proyectos");
  const proyecto = typeof sp.proyecto === "string" && catalogos.proyectos.some((p) => p.id === sp.proyecto) ? sp.proyecto : null;
  const fecha = typeof sp.fecha === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sp.fecha) ? sp.fecha : null;

  return (
    <div className="max-w-2xl">
      <Titulo>Nueva tarea</Titulo>
      <div className="rounded-lg border border-white/70 bg-card p-4 md:p-6">
        <FormularioTarea
          accion={crearTarea}
          catalogos={catalogos}
          valoresIniciales={{ responsable_id: usuario.id, proyecto_id: proyecto, fecha_limite: fecha }}
          volver={volver}
          textoBoton="Crear tarea"
        />
      </div>
    </div>
  );
}
