import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos, obtenerProyecto } from "@/lib/tareas";
import { FormularioProyecto } from "@/components/proyectos/formulario-proyecto";
import { BotonEliminar } from "@/components/ui/boton-eliminar";
import { Titulo } from "@/components/panel/titulo";
import { actualizarProyecto, eliminarProyecto } from "../../acciones";

export const metadata: Metadata = { title: "Editar proyecto" };

export default async function EditarProyectoPage({ params }: PageProps<"/proyectos/[id]/editar">) {
  const usuario = await obtenerUsuario();
  const { id } = await params;
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) notFound();
  const catalogos = await obtenerCatalogos(usuario.id);

  return (
    <div className="max-w-2xl">
      <Titulo
        accion={
          <BotonEliminar
            accion={eliminarProyecto.bind(null, proyecto.id)}
            pregunta={`¿Eliminar "${proyecto.nombre}"? Sus tareas se conservan como tareas sueltas.`}
          />
        }
      >
        Editar proyecto
      </Titulo>
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <FormularioProyecto
          accion={actualizarProyecto.bind(null, proyecto.id)}
          catalogos={catalogos}
          proyecto={proyecto}
          cancelar={`/proyectos/${proyecto.id}`}
          textoBoton="Guardar"
        />
      </div>
    </div>
  );
}
