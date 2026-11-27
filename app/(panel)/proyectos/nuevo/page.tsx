import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { FormularioProyecto } from "@/components/proyectos/formulario-proyecto";
import { Titulo } from "@/components/panel/titulo";
import { crearProyecto } from "../acciones";

export const metadata: Metadata = { title: "Nuevo proyecto" };

export default async function NuevoProyectoPage() {
  const usuario = await obtenerUsuario();
  const catalogos = await obtenerCatalogos(usuario.id);
  return (
    <div className="max-w-2xl">
      <Titulo>Nuevo proyecto</Titulo>
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <FormularioProyecto accion={crearProyecto} catalogos={catalogos} cancelar="/proyectos?vista=proyectos" textoBoton="Crear proyecto" />
      </div>
    </div>
  );
}
