import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ListTodo, Phone, Globe2, AtSign } from "lucide-react";
import { LOCALE, ZONA_HORARIA } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { leerFiltrosBandeja, obtenerMensaje, obtenerMensajes } from "@/lib/bandeja";
import { enlaceRespuesta, NOMBRE_CANAL, NOMBRE_ESTADO_MENSAJE } from "@/lib/inbox/tipos";
import { haceCuanto } from "@/lib/tiempo";
import { hoyISO } from "@/lib/fechas";
import { Badge } from "@/components/ui/badge";
import { IconoCanal } from "@/components/bandeja/icono-canal";
import { AccionesMensaje } from "@/components/bandeja/acciones-mensaje";
import { ListaMensajes } from "@/components/bandeja/lista-mensajes";
import { qsBandeja } from "@/components/bandeja/filtros";

export const metadata: Metadata = { title: "Mensaje" };

const VARIANTE = { nuevo: "nuevo", leido: "default", respondido: "aceptada", archivado: "baja" } as const;

export default async function MensajePage({ params, searchParams }: PageProps<"/bandeja/[id]">) {
  const usuario = await obtenerUsuario();
  const { id } = await params;
  const f = leerFiltrosBandeja(await searchParams);
  const [datos, { perfiles }, lista] = await Promise.all([obtenerMensaje(id), obtenerCatalogos(usuario.id), obtenerMensajes(f, usuario.id)]);
  if (!datos) notFound();
  const { mensaje: m, tareas } = datos;
  const recibido = new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, dateStyle: "long", timeStyle: "short" }).format(new Date(m.recibido_en));
  const crudos = m.datos_crudos ?? {};
  const telefono = typeof crudos.telefono === "string" && crudos.telefono !== m.remitente_contacto ? crudos.telefono : null;
  const pagina = typeof crudos.pagina === "string" ? crudos.pagina : null;
  const qs = qsBandeja(f);
  const hace = Object.fromEntries(lista.map((x) => [x.id, haceCuanto(x.recibido_en)]));
  const nombre = m.remitente_nombre ?? m.remitente_contacto ?? "Sin nombre";
  const iniciales = nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      {/* Lista (solo computadora) */}
      <aside className="hidden md:block" aria-label="Mensajes">
        <h1 className="mb-3 text-[1.75rem] font-black tracking-tight text-ergon-navy">
          <Link href={qs ? `/bandeja?${qs}` : "/bandeja"} className="hover:underline">
            Bandeja
          </Link>
        </h1>
        <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto pb-2 pr-1">
          <ListaMensajes mensajes={lista} perfiles={perfiles} hace={hace} qs={qs} seleccionado={m.id} compacta />
        </div>
      </aside>

      {/* Conversación */}
      <div className="min-w-0">
        <Link href={qs ? `/bandeja?${qs}` : "/bandeja"} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline md:hidden">
          <ArrowLeft className="size-4" aria-hidden /> Bandeja
        </Link>
        <article className="overflow-hidden rounded-[1.25rem] border border-white/70 bg-card shadow-sm">
          <header className="flex items-start gap-3 border-b p-4 md:p-5">
            <IconoCanal canal={m.canal} className="size-11 rounded-xl" />
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-black text-ergon-navy md:text-2xl">{m.asunto ?? nombre}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {NOMBRE_CANAL[m.canal]} · {recibido}
                {crudos.prueba ? " · Mensaje de prueba" : ""}
              </p>
            </div>
            <Badge variant={VARIANTE[m.estado === "nuevo" ? "leido" : m.estado]}>{NOMBRE_ESTADO_MENSAJE[m.estado === "nuevo" ? "leido" : m.estado]}</Badge>
          </header>

          {/* Datos del contacto */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b bg-muted/50 px-4 py-2.5 text-sm md:px-5">
            <span className="font-bold text-ergon-navy">{nombre}</span>
            {m.remitente_contacto ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <AtSign className="size-3.5" aria-hidden /> {m.remitente_contacto}
              </span>
            ) : null}
            {telefono ? (
              <a href={`tel:${telefono}`} className="flex items-center gap-1 text-muted-foreground hover:text-primary">
                <Phone className="size-3.5" aria-hidden /> {telefono}
              </a>
            ) : null}
            {pagina ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Globe2 className="size-3.5" aria-hidden /> {pagina}
              </span>
            ) : null}
          </div>

          {/* Burbuja del mensaje */}
          <div className="p-4 md:p-6">
            <div className="flex items-end gap-2.5">
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ergon-navy/[0.08] text-[11px] font-black text-ergon-navy" aria-hidden>
                {iniciales}
              </span>
              <div className="max-w-[min(36rem,100%)]">
                <div className="whitespace-pre-line break-words rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
                  {m.cuerpo || "(Sin texto)"}
                </div>
                <p className="mt-1 pl-1 text-[11px] text-muted-foreground">{haceCuanto(m.recibido_en)}</p>
              </div>
            </div>
          </div>

          {tareas.length ? (
            <footer className="border-t p-4 md:px-6">
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

        <div className="mt-4">
          <AccionesMensaje
            id={m.id}
            estado={m.estado}
            asignadoA={m.asignado_a}
            perfiles={perfiles}
            yoId={usuario.id}
            respuesta={enlaceRespuesta(m)}
            reunion={{ titulo: `Reunión con ${nombre}`, fecha: hoyISO() }}
          />
        </div>
      </div>
    </div>
  );
}
