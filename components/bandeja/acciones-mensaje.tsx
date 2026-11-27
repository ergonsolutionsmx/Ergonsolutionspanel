"use client";

import Link from "next/link";
import { useEffect, useTransition } from "react";
import { Archive, ArchiveRestore, CheckCheck, ExternalLink, ListPlus, Mail, MailOpen, Reply } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/avisos/toast";
import { AgendarReunion } from "@/components/agenda/agendar-reunion";
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
  reunion,
}: {
  reunion: { titulo: string; fecha: string };
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

  const hacerAviso = (fn: () => Promise<unknown>, aviso: string) =>
    startTransition(async () => {
      await fn();
      toast.success(aviso);
    });

  return (
    <div className="grid gap-3">
      {/* Barra de acciones */}
      <section className="flex flex-wrap items-center gap-2 rounded-[1.25rem] border border-white/70 bg-card p-3 shadow-sm" aria-label="Acciones">
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
        ) : null}
        <Button variant="outline" disabled={pendiente} onClick={() => hacerAviso(() => convertirEnTarea(id), "Tarea creada")}>
          <ListPlus /> Convertir en tarea
        </Button>
        <AgendarReunion perfiles={perfiles} yoId={yoId} fecha={reunion.fecha} tituloInicial={reunion.titulo} />
        <div className="flex flex-wrap gap-1 md:ml-auto">
          {estado !== "respondido" ? (
            <Button variant="ghost" disabled={pendiente} onClick={() => hacerAviso(() => cambiarEstadoMensaje(id, "respondido"), "Marcado como respondido")}>
              <CheckCheck /> Respondido
            </Button>
          ) : null}
          {estado === "leido" ? (
            <Button variant="ghost" disabled={pendiente} onClick={() => hacer(() => cambiarEstadoMensaje(id, "nuevo"))}>
              <Mail /> No leído
            </Button>
          ) : estado !== "nuevo" ? (
            <Button variant="ghost" disabled={pendiente} onClick={() => hacer(() => cambiarEstadoMensaje(id, "leido"))}>
              <MailOpen /> Leído
            </Button>
          ) : null}
          {estado === "archivado" ? (
            <Button variant="ghost" disabled={pendiente} onClick={() => hacerAviso(() => cambiarEstadoMensaje(id, "leido"), "Sacado del archivo")}>
              <ArchiveRestore /> Sacar del archivo
            </Button>
          ) : (
            <Button variant="ghost" disabled={pendiente} onClick={() => hacerAviso(() => cambiarEstadoMensaje(id, "archivado"), "Mensaje archivado")}>
              <Archive /> Archivar
            </Button>
          )}
        </div>
      </section>

      <section className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-white/70 bg-card p-3 shadow-sm" aria-label="Asignar">
        <label htmlFor="asignado" className="text-sm font-bold text-ergon-navy">
          Asignado a
        </label>
        <div className="min-w-48 flex-1 sm:max-w-xs">
          <NativeSelect
            id="asignado"
            value={asignadoA ?? ""}
            disabled={pendiente}
            onChange={(e) => hacerAviso(() => asignarMensaje(id, e.target.value || null), "Asignación guardada")}
          >
            <option value="">Sin asignar</option>
            {perfiles.map((p) => (
              <option key={p.usuario_id} value={p.usuario_id}>
                {p.usuario_id === yoId ? `${p.nombre} (yo)` : p.nombre}
              </option>
            ))}
          </NativeSelect>
        </div>
      </section>
    </div>
  );
}
