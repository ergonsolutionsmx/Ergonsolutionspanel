"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { Archive, ArchiveRestore, CheckCheck, ExternalLink, ListPlus, Mail, MailOpen, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NativeSelect } from "@/components/ui/native-select";
import type { EstadoMensaje, Respuesta } from "@/lib/inbox/tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import {
  asignarMensaje,
  cambiarEstadoMensaje,
  convertirEnTarea,
  marcarLeidoSiNuevo,
} from "@/app/(panel)/bandeja/acciones";

export function AccionesMensaje({
  id,
  estado,
  asignadoA,
  perfiles,
  yoId,
  respuesta,
}: {
  id: string;
  estado: EstadoMensaje;
  asignadoA: string | null;
  perfiles: PerfilCorto[];
  yoId: string;
  respuesta: Respuesta;
}) {
  const [pendiente, startTransition] = useTransition();
  const hacer = (fn: () => Promise<unknown>) => startTransition(async () => void (await fn()));

  // Abrir un mensaje nuevo lo marca como leído.
  useEffect(() => {
    if (estado === "nuevo") void marcarLeidoSiNuevo(id);
  }, [id, estado]);

  return (
    <div className="grid gap-4">
      <section className="grid gap-2 rounded-lg border bg-card p-4" aria-label="Responder">
        {respuesta?.tipo === "externo" ? (
          <Button
            disabled={pendiente}
            onClick={() => {
              // Abre el correo o WhatsApp y marca el mensaje como respondido.
              window.open(respuesta.url, "_blank", "noopener,noreferrer");
              hacer(() => cambiarEstadoMensaje(id, "respondido"));
            }}
          >
            <Reply /> {respuesta.etiqueta}
          </Button>
        ) : respuesta?.tipo === "interno" ? (
          <Button asChild>
            <Link href={respuesta.url}>
              <ExternalLink /> Abrir
            </Link>
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Sin contacto para responder.</p>
        )}
        <Button variant="outline" disabled={pendiente} onClick={() => hacer(() => convertirEnTarea(id))}>
          <ListPlus /> Convertir en tarea
        </Button>
      </section>

      <section className="grid gap-2 rounded-lg border bg-card p-4" aria-label="Asignar">
        <label htmlFor="asignado" className="text-sm font-bold">
          Asignado a
        </label>
        <NativeSelect
          id="asignado"
          value={asignadoA ?? ""}
          disabled={pendiente}
          onChange={(e) => hacer(() => asignarMensaje(id, e.target.value || null))}
        >
          <option value="">Sin asignar</option>
          {perfiles.map((p) => (
            <option key={p.usuario_id} value={p.usuario_id}>
              {p.usuario_id === yoId ? `${p.nombre} (yo)` : p.nombre}
            </option>
          ))}
        </NativeSelect>
      </section>

      <section className="grid gap-2 rounded-lg border bg-card p-4" aria-label="Estado">
        {estado !== "respondido" ? (
          <Button variant="outline" disabled={pendiente} onClick={() => hacer(() => cambiarEstadoMensaje(id, "respondido"))}>
            <CheckCheck /> Marcar respondido
          </Button>
        ) : null}
        {estado === "nuevo" || estado === "leido" ? null : (
          <Button variant="ghost" disabled={pendiente} onClick={() => hacer(() => cambiarEstadoMensaje(id, "leido"))}>
            <MailOpen /> Marcar como leído
          </Button>
        )}
        {estado === "leido" ? (
          <Button variant="ghost" disabled={pendiente} onClick={() => hacer(() => cambiarEstadoMensaje(id, "nuevo"))}>
            <Mail /> Marcar como no leído
          </Button>
        ) : null}
        {estado === "archivado" ? (
          <Button variant="ghost" disabled={pendiente} onClick={() => hacer(() => cambiarEstadoMensaje(id, "leido"))}>
            <ArchiveRestore /> Sacar del archivo
          </Button>
        ) : (
          <Button variant="ghost" disabled={pendiente} onClick={() => hacer(() => cambiarEstadoMensaje(id, "archivado"))}>
            <Archive /> Archivar
          </Button>
        )}
      </section>
    </div>
  );
}
