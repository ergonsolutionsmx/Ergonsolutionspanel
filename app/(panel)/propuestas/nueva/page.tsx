import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { Titulo } from "@/components/panel/titulo";
import { FormularioProspecto } from "@/components/propuestas/formulario-prospecto";
import { crearPropuesta } from "../acciones";

export const metadata: Metadata = { title: "Nueva propuesta" };

export default async function NuevaPropuestaPage({ searchParams }: PageProps<"/propuestas/nueva">) {
  await obtenerUsuario();
  const sp = await searchParams;
  const servicio = typeof sp.servicio === "string" && /^[0-9a-f-]{36}$/i.test(sp.servicio) ? sp.servicio : undefined;
  return (
    <div className="max-w-3xl">
      <Titulo>Nueva propuesta</Titulo>
      <p className="mb-4 text-sm text-muted-foreground">Paso 1 de 4 · Datos del cliente. Se guarda como borrador.</p>
      <div className="rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm md:p-6">
        <FormularioProspecto accion={crearPropuesta} textoBoton="Siguiente: servicios" cancelar="/propuestas" servicioId={servicio} />
      </div>
    </div>
  );
}
