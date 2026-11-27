import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { FormularioServicio } from "@/components/catalogo/formulario-servicio";
import { Titulo } from "@/components/panel/titulo";
import { crearServicio } from "../acciones";

export const metadata: Metadata = { title: "Nuevo servicio" };

export default async function NuevoServicioPage() {
  await obtenerUsuario();
  return (
    <div className="max-w-3xl">
      <Titulo>Nuevo servicio</Titulo>
      <div className="rounded-lg border bg-card p-4 md:p-6">
        <FormularioServicio accion={crearServicio} cancelar="/catalogo" textoBoton="Crear y agregar variantes" />
      </div>
    </div>
  );
}
