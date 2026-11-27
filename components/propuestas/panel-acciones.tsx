"use client";

import { useState, useTransition } from "react";
import { Archive, ArchiveRestore, Check, Copy, Download, ExternalLink, FilePlus2, RefreshCw, Send, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { EstadoPropuesta } from "@/lib/propuestas-tipos";
import {
  archivarPropuesta,
  duplicarPropuesta,
  eliminarBorrador,
  marcarEnviada,
  marcarRespuesta,
  renovar,
} from "@/app/(panel)/propuestas/acciones";

export function PanelAcciones({
  id,
  estado,
  token,
  archivada,
  textoVigencia,
  textoVista,
  vencida,
}: {
  id: string;
  estado: EstadoPropuesta;
  token: string;
  archivada: boolean;
  textoVigencia: string | null;
  textoVista: string | null;
  vencida: boolean;
}) {
  const [pendiente, startTransition] = useTransition();
  const [copiado, setCopiado] = useState(false);
  const borrador = estado === "borrador";
  const ruta = `/p/${token}`;

  const hacer = (fn: () => Promise<unknown>, pregunta?: string) => {
    if (pregunta && !window.confirm(pregunta)) return;
    startTransition(async () => {
      await fn();
    });
  };

  async function copiar() {
    await navigator.clipboard.writeText(`${window.location.origin}${ruta}`);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="grid gap-4">
      <section className="rounded-lg border bg-card p-4" aria-label="Link para el prospecto">
        <h2 className="mb-2 font-black text-ergon-navy">Link para el prospecto</h2>
        {borrador ? (
          <>
            <p className="mb-3 text-sm text-muted-foreground">El link se activa al enviarla y dura 30 días.</p>
            <Button className="w-full" disabled={pendiente} onClick={() => hacer(() => marcarEnviada(id))}>
              <Send /> Marcar como enviada
            </Button>
          </>
        ) : (
          <div className="grid gap-3">
            <div className="flex gap-2">
              <input
                readOnly
                value={ruta}
                aria-label="Link público"
                className="h-10 min-w-0 flex-1 rounded-md border bg-muted px-3 text-xs text-muted-foreground"
              />
              <Button variant="outline" size="icon" onClick={copiar} aria-label="Copiar link" title="Copiar link">
                {copiado ? <Check className="text-emerald-600" /> : <Copy />}
              </Button>
              <Button asChild variant="outline" size="icon" aria-label="Abrir link" title="Abrir link">
                <a href={ruta} target="_blank" rel="noopener noreferrer">
                  <ExternalLink />
                </a>
              </Button>
            </div>
            {copiado ? <p role="status" className="text-xs text-emerald-700">Link copiado.</p> : null}
            {textoVigencia ? <p className={vencida ? "text-sm font-bold text-red-700" : "text-sm"}>{textoVigencia}</p> : null}
            {textoVista ? <p className="text-sm text-muted-foreground">{textoVista}</p> : null}
            <Button variant="outline" disabled={pendiente} onClick={() => hacer(() => renovar(id))}>
              <RefreshCw /> Renovar 30 días
            </Button>
            <p className="text-xs text-muted-foreground">Si tú abres el link con tu sesión, no cuenta como &ldquo;vista&rdquo;.</p>
          </div>
        )}
      </section>

      {!borrador && estado !== "aceptada" && estado !== "rechazada" ? (
        <section className="rounded-lg border bg-card p-4" aria-label="Respuesta del prospecto">
          <h2 className="mb-2 font-black text-ergon-navy">Respuesta</h2>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className="border-emerald-300 text-emerald-800 hover:bg-emerald-50"
              disabled={pendiente}
              onClick={() => hacer(() => marcarRespuesta(id, "aceptada"), "¿Marcar como aceptada?")}
            >
              <ThumbsUp /> Aceptada
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-800 hover:bg-red-50"
              disabled={pendiente}
              onClick={() => hacer(() => marcarRespuesta(id, "rechazada"), "¿Marcar como rechazada?")}
            >
              <ThumbsDown /> Rechazada
            </Button>
          </div>
        </section>
      ) : null}

      <section className="grid gap-2 rounded-lg border bg-card p-4" aria-label="Más acciones">
        <Button asChild variant="outline">
          <a href={`/propuestas/${id}/pdf`} download>
            <Download /> Descargar PDF
          </a>
        </Button>
        <Button variant="outline" disabled={pendiente} onClick={() => hacer(() => duplicarPropuesta(id))}>
          <FilePlus2 /> Duplicar
        </Button>
        {borrador ? (
          <Button
            variant="ghost"
            className="text-red-700 hover:bg-red-50"
            disabled={pendiente}
            onClick={() => hacer(() => eliminarBorrador(id), "¿Eliminar este borrador? No se puede deshacer.")}
          >
            <Trash2 /> Eliminar borrador
          </Button>
        ) : (
          <Button
            variant="ghost"
            disabled={pendiente}
            onClick={() =>
              hacer(
                () => archivarPropuesta(id, !archivada),
                archivada ? "¿Sacar del archivo?" : "¿Archivar? El link deja de funcionar, pero no se borra.",
              )
            }
          >
            {archivada ? <ArchiveRestore /> : <Archive />} {archivada ? "Desarchivar" : "Archivar"}
          </Button>
        )}
      </section>
    </div>
  );
}
