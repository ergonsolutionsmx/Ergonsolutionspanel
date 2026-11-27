import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { obtenerEvento } from "@/lib/agenda";
import { partesCDMX } from "@/lib/fechas";
import { haceCuanto } from "@/lib/tiempo";
import { FormularioEvento } from "@/components/agenda/formulario-evento";
import { BotonEliminar } from "@/components/ui/boton-eliminar";
import { Titulo } from "@/components/panel/titulo";
import { actualizarEvento, eliminarEvento } from "../../acciones";

export const metadata: Metadata = { title: "Evento" };

export default async function EventoPage({ params, searchParams }: PageProps<"/agenda/eventos/[id]">) {
  const usuario = await obtenerUsuario();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const evento = await obtenerEvento(id);
  if (!evento) notFound();

  const { perfiles } = await obtenerCatalogos(usuario.id);
  const ini = partesCDMX(evento.inicio);
  const fin = partesCDMX(evento.fin);
  const volver = rutaSegura(sp.volver, `/agenda?vista=dia&fecha=${ini.fecha}`);
  const creador = perfiles.find((p) => p.usuario_id === evento.creado_por);

  return (
    <div className="max-w-2xl">
      <Titulo accion={<BotonEliminar accion={eliminarEvento.bind(null, evento.id, volver)} pregunta="¿Eliminar este evento?" />}>
        Evento
      </Titulo>
      <div className="rounded-lg border border-white/70 bg-card p-4 md:p-6">
        <FormularioEvento
          accion={actualizarEvento.bind(null, evento.id)}
          perfiles={perfiles}
          yoId={usuario.id}
          volver={volver}
          textoBoton="Guardar"
          valores={{
            titulo: evento.titulo,
            todoElDia: evento.todo_el_dia,
            fechaInicio: ini.fecha,
            horaInicio: evento.todo_el_dia ? "09:00" : ini.hora,
            fechaFin: fin.fecha,
            horaFin: evento.todo_el_dia ? "10:00" : fin.hora,
            lugar: evento.lugar ?? "",
            enlace: evento.enlace ?? "",
            notas: evento.notas ?? "",
            responsableId: evento.responsable_id ?? "",
          }}
        />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Creado {haceCuanto(evento.creado_en)}
        {creador ? ` por ${creador.nombre}` : ""}
      </p>
    </div>
  );
}
