import type { Metadata } from "next";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { notFound } from "next/navigation";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { obtenerCatalogos, obtenerTarea } from "@/lib/tareas";
import { haceCuanto } from "@/lib/tiempo";
import { FormularioTarea } from "@/components/tareas/formulario-tarea";
import { BotonEliminar } from "@/components/ui/boton-eliminar";
import { Titulo } from "@/components/panel/titulo";
import { actualizarTarea, eliminarTarea } from "../../acciones";

export const metadata: Metadata = { title: "Tarea" };

export default async function TareaPage({ params, searchParams }: PageProps<"/proyectos/tareas/[id]">) {
  const usuario = await obtenerUsuario();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const tarea = await obtenerTarea(id);
  if (!tarea) notFound();

  const catalogos = await obtenerCatalogos(usuario.id);
  const volver = rutaSegura(sp.volver, tarea.proyecto_id ? `/proyectos/${tarea.proyecto_id}` : "/proyectos");
  const creador = catalogos.perfiles.find((p) => p.usuario_id === tarea.creado_por);

  return (
    <div className="max-w-2xl">
      <Titulo accion={<BotonEliminar accion={eliminarTarea.bind(null, tarea.id, volver)} pregunta="¿Eliminar esta tarea? No se puede deshacer." />}>
        Tarea
      </Titulo>
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <FormularioTarea
          accion={actualizarTarea.bind(null, tarea.id)}
          catalogos={catalogos}
          tarea={tarea}
          volver={volver}
          textoBoton="Guardar"
        />
      </div>
      {tarea.mensaje_id ? (
        <Link href={`/bandeja/${tarea.mensaje_id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
          <Inbox className="size-4" aria-hidden /> Ver mensaje original
        </Link>
      ) : null}
      <p className="mt-3 text-xs text-muted-foreground">
        Creada {haceCuanto(tarea.creado_en)}
        {creador ? ` por ${creador.nombre}` : ""}
      </p>
    </div>
  );
}
