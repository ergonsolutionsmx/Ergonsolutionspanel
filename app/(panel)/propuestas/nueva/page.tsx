import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { Titulo } from "@/components/panel/titulo";
import { FormularioProspecto } from "@/components/propuestas/formulario-prospecto";
import { crearPropuesta } from "../acciones";

export const metadata: Metadata = { title: "Nueva propuesta" };

export default async function NuevaPropuestaPage() {
  await obtenerUsuario();
  return (
    <div className="max-w-3xl">
      <Titulo>Nueva propuesta</Titulo>
      <div className="rounded-lg border border-white/70 bg-card p-4 md:p-6">
        <FormularioProspecto accion={crearPropuesta} textoBoton="Crear y agregar servicios" cancelar="/propuestas" />
      </div>
    </div>
  );
}
