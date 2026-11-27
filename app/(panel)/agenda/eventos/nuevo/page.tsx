import type { Metadata } from "next";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { FECHA_VALIDA, hoyISO } from "@/lib/fechas";
import { FormularioEvento } from "@/components/agenda/formulario-evento";
import { Titulo } from "@/components/panel/titulo";
import { crearEvento } from "../../acciones";

export const metadata: Metadata = { title: "Nuevo evento" };

export default async function NuevoEventoPage({ searchParams }: PageProps<"/agenda/eventos/nuevo">) {
  const usuario = await obtenerUsuario();
  const sp = await searchParams;
  const { perfiles } = await obtenerCatalogos(usuario.id);
  const fecha = typeof sp.fecha === "string" && FECHA_VALIDA.test(sp.fecha) ? sp.fecha : hoyISO();

  return (
    <div className="max-w-2xl">
      <Titulo>Nuevo evento</Titulo>
      <div className="rounded-lg border border-white/70 bg-card p-4 md:p-6">
        <FormularioEvento
          accion={crearEvento}
          perfiles={perfiles}
          yoId={usuario.id}
          volver={rutaSegura(sp.volver, "/agenda")}
          textoBoton="Crear evento"
          valores={{
            titulo: "",
            todoElDia: false,
            fechaInicio: fecha,
            horaInicio: "09:00",
            fechaFin: fecha,
            horaFin: "10:00",
            lugar: "",
            notas: "",
            responsableId: usuario.id,
          }}
        />
      </div>
    </div>
  );
}
