import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { fechaLarga } from "@/lib/utils";
import { inicioSimple } from "@/lib/inicio";
import { QuickActions } from "@/components/inicio/quick-actions";
import { PendientesHoy, ResumenSecciones, TrabajosEnCurso } from "@/components/inicio/inicio-simple";

export const metadata: Metadata = { title: "Inicio" };

/** "Buenos días / Buenas tardes / Buenas noches" según la hora de CDMX. */
function saludo() {
  const hora = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/Mexico_City", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return hora < 12 ? "Buenos días" : hora < 19 ? "Buenas tardes" : "Buenas noches";
}

/** Inicio simple: resumen por sección, pendientes de hoy y en qué fase va cada trabajo. */
export default async function InicioPage() {
  const usuario = await obtenerUsuario();
  const nombre = usuario.nombre.split(" ")[0];
  const { resumen, pendientes, trabajos } = await inicioSimple(usuario.id);

  return (
    <div className="space-y-4 md:space-y-5">
      <section className="flex flex-wrap items-end justify-between gap-4" aria-label="Saludo">
        <div>
          <p className="text-sm text-muted-foreground">{fechaLarga()}</p>
          <h1 className="mt-1 text-[1.75rem] font-black leading-tight tracking-tight text-ergon-navy md:text-[2rem]">
            {saludo()}, {nombre}
          </h1>
        </div>
        <QuickActions />
      </section>

      <ResumenSecciones r={resumen} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.15fr]">
        <PendientesHoy items={pendientes} />
        <TrabajosEnCurso trabajos={trabajos} />
      </div>
    </div>
  );
}
