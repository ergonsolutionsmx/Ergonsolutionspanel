import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListTodo } from "lucide-react";
import { LOCALE, ZONA_HORARIA } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { obtenerMensaje } from "@/lib/bandeja";
import { enlaceRespuesta, NOMBRE_CANAL, NOMBRE_ESTADO_MENSAJE } from "@/lib/inbox/tipos";
import { Badge } from "@/components/ui/badge";
import { IconoCanal } from "@/components/bandeja/icono-canal";
import { AccionesMensaje } from "@/components/bandeja/acciones-mensaje";

export const metadata: Metadata = { title: "Mensaje" };

export default async function MensajePage({ params }: PageProps<"/bandeja/[id]">) {
  const usuario = await obtenerUsuario();
  const { id } = await params;
  const [datos, { perfiles }] = await Promise.all([obtenerMensaje(id), obtenerCatalogos(usuario.id)]);
  if (!datos) notFound();
  const { mensaje: m, tareas } = datos;
  const recibido = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, dateStyle: "long", timeStyle: "short" }).format(
    new Date(m.recibido_en),
  );
  const crudos = m.datos_crudos ?? {};
  const extras = [
    typeof crudos.telefono === "string" && crudos.telefono !== m.remitente_contacto ? `Tel. ${crudos.telefono}` : null,
    typeof crudos.pagina === "string" ? `Desde ${crudos.pagina}` : null,
    crudos.prueba ? "Mensaje de prueba" : null,
  ].filter(Boolean);

  return (
    <>
      <Link href="/bandeja" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Bandeja
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <article className="min-w-0 rounded-lg border border-white/70 bg-card">
          <header className="flex items-start gap-3 border-b p-4 md:p-5">
            <IconoCanal canal={m.canal} className="size-11" />
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black text-ergon-navy">{m.asunto ?? m.remitente_nombre ?? "Mensaje"}</h1>
              <p className="mt-1 text-sm">
                <strong>{m.remitente_nombre ?? "Sin nombre"}</strong>
                {m.remitente_contacto ? <span className="text-muted-foreground"> · {m.remitente_contacto}</span> : null}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {NOMBRE_CANAL[m.canal]} · {recibido}
                {extras.length ? ` · ${extras.join(" · ")}` : ""}
              </p>
            </div>
            <Badge variant={m.estado === "respondido" ? "verde" : m.estado === "archivado" ? "gris" : "azul"}>
              {NOMBRE_ESTADO_MENSAJE[m.estado === "nuevo" ? "leido" : m.estado]}
            </Badge>
          </header>
          <div className="whitespace-pre-line break-words p-4 text-sm leading-relaxed md:p-5">{m.cuerpo || "(Sin texto)"}</div>
          {tareas.length ? (
            <footer className="border-t p-4 md:p-5">
              <p className="mb-2 text-xs font-bold uppercase text-muted-foreground">Tareas de este mensaje</p>
              <ul className="space-y-1">
                {tareas.map((t) => (
                  <li key={t.id}>
                    <Link
                      href={`/proyectos/tareas/${t.id}?volver=${encodeURIComponent(`/bandeja/${m.id}`)}`}
                      className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline"
                    >
                      <ListTodo className="size-4" aria-hidden /> {t.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </footer>
          ) : null}
        </article>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <AccionesMensaje
            id={m.id}
            estado={m.estado}
            asignadoA={m.asignado_a}
            perfiles={perfiles}
            yoId={usuario.id}
            respuesta={enlaceRespuesta(m)}
          />
        </aside>
      </div>
    </>
  );
}
