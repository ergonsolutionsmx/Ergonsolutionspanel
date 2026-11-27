import type { Metadata } from "next";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { leerFiltrosBandeja, obtenerMensajes } from "@/lib/bandeja";
import { CANALES, ESTADOS_MENSAJE, NOMBRE_CANAL_CORTO, NOMBRE_ESTADO_MENSAJE } from "@/lib/inbox/tipos";
import { haceCuanto } from "@/lib/tiempo";
import { Titulo } from "@/components/panel/titulo";
import { Avatar } from "@/components/tareas/etiquetas";
import { IconoCanal } from "@/components/bandeja/icono-canal";

export const metadata: Metadata = { title: "Bandeja" };

export default async function BandejaPage({ searchParams }: PageProps<"/bandeja">) {
  const usuario = await obtenerUsuario();
  const sp = await searchParams;
  const f = leerFiltrosBandeja(sp);
  const [mensajes, { perfiles }] = await Promise.all([obtenerMensajes(f, usuario.id), obtenerCatalogos(usuario.id)]);

  const href = (cambios: Record<string, string>) => {
    const p = new URLSearchParams({ canal: f.canal, estado: f.estado, asignado: f.asignado === "todos" ? "" : f.asignado, ...cambios });
    for (const [k, v] of [...p.entries()]) if (!v) p.delete(k);
    return p.size ? `/bandeja?${p}` : "/bandeja";
  };
  const chip = (activo: boolean, url: string, texto: string) => (
    <Link
      key={url + texto}
      href={url}
      aria-current={activo ? "true" : undefined}
      className={cn(
        "flex h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm font-bold",
        activo ? "border-ergon-navy bg-ergon-navy text-white" : "bg-card text-ergon-navy hover:bg-accent",
      )}
    >
      {texto}
    </Link>
  );
  const otros = perfiles.filter((p) => p.usuario_id !== usuario.id);

  return (
    <>
      <Titulo>Bandeja</Titulo>
      <div className="mb-3 -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Canal">
        {chip(!f.canal, href({ canal: "" }), "Todos")}
        {CANALES.map((c) => chip(f.canal === c, href({ canal: c }), NOMBRE_CANAL_CORTO[c]))}
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0" aria-label="Estado">
          {chip(!f.estado, href({ estado: "" }), "Sin archivar")}
          {ESTADOS_MENSAJE.map((e) => chip(f.estado === e, href({ estado: e }), NOMBRE_ESTADO_MENSAJE[e]))}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:ml-auto md:px-0" aria-label="Asignado">
          {chip(f.asignado === "todos", href({ asignado: "" }), "De todos")}
          {chip(f.asignado === "mios", href({ asignado: "mios" }), "Míos")}
          {otros.map((p) => chip(f.asignado === p.usuario_id, href({ asignado: p.usuario_id }), `De ${p.nombre.split(" ")[0]}`))}
          {chip(f.asignado === "sin", href({ asignado: "sin" }), "Sin asignar")}
        </div>
      </div>

      {mensajes.length === 0 ? (
        <p className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
          Sin mensajes. Puedes crear uno de prueba en Ajustes → Canales.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {mensajes.map((m) => {
            const nuevo = m.estado === "nuevo";
            return (
              <li key={m.id}>
                <Link href={`/bandeja/${m.id}`} className={cn("flex items-start gap-3 px-4 py-3 hover:bg-muted", nuevo && "bg-accent/40")}>
                  <IconoCanal canal={m.canal} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className={cn("truncate text-sm", nuevo ? "font-black" : "font-bold")}>
                        {m.remitente_nombre ?? m.remitente_contacto ?? "Sin nombre"}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{haceCuanto(m.recibido_en)}</span>
                    </div>
                    {m.asunto ? <p className={cn("truncate text-sm", nuevo && "font-bold")}>{m.asunto}</p> : null}
                    <p className="truncate text-sm text-muted-foreground">{m.cuerpo}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    {nuevo ? (
                      <span className="rounded-full bg-ergon-blue px-2 py-0.5 text-xs font-bold text-white">Nuevo</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{NOMBRE_ESTADO_MENSAJE[m.estado]}</span>
                    )}
                    {m.asignado_a ? <Avatar perfil={perfiles.find((p) => p.usuario_id === m.asignado_a)} /> : null}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
