import type { Metadata } from "next";
import { obtenerUsuario, rutaSegura } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { FECHA_VALIDA, hoyISO } from "@/lib/fechas";
import { EventScheduler } from "@/components/ui/event-scheduler";
import { Titulo } from "@/components/panel/titulo";

export const metadata: Metadata = { title: "Nuevo" };

export default async function NuevoEventoPage({ searchParams }: PageProps<"/agenda/eventos/nuevo">) {
  const usuario = await obtenerUsuario();
  const sp = await searchParams;
  const catalogos = await obtenerCatalogos(usuario.id);
  const fecha = typeof sp.fecha === "string" && FECHA_VALIDA.test(sp.fecha) ? sp.fecha : hoyISO();

  return (
    <div className="max-w-2xl">
      <Titulo>Nuevo evento o tarea</Titulo>
      <div className="rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm md:p-6">
        <EventScheduler
          modoInicial={sp.tipo === "tarea" ? "tarea" : "evento"}
          catalogos={catalogos}
          fecha={fecha}
          volver={rutaSegura(sp.volver, "/agenda")}
        />
      </div>
    </div>
  );
}
