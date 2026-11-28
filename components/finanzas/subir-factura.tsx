"use client";

import { useRef, useState } from "react";
import { CircleCheck, FileText, LoaderCircle, Trash2, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { crearClienteNavegador } from "@/lib/supabase/client";
import { enlaceFactura } from "@/app/(panel)/finanzas/acciones";

const TIPOS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/xml": "xml",
  "text/xml": "xml",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const MAX = 5 * 1024 * 1024;

type Estado = { fase: "vacio" } | { fase: "subiendo"; nombre: string } | { fase: "listo"; nombre: string } | { fase: "error"; mensaje: string };

/** Abre una factura guardada en una pestaña nueva (link temporal de 5 minutos). */
export async function abrirFactura(ruta: string) {
  const ventana = window.open("", "_blank");
  const url = await enlaceFactura(ruta);
  if (ventana && url) ventana.location.href = url;
  else ventana?.close();
}

/**
 * Zona para arrastrar o elegir la factura (PDF, XML o foto, máx. 5 MB).
 * Sube directo al bucket privado y deja la ruta en un input oculto (inspirada en File Dropzone de 21st.dev).
 */
export function SubirFactura({ ruta, onCambio }: { ruta: string; onCambio: (ruta: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [encima, setEncima] = useState(false);
  const [estado, setEstado] = useState<Estado>(ruta ? { fase: "listo", nombre: "Factura guardada" } : { fase: "vacio" });

  const subir = async (archivo: File) => {
    const ext = TIPOS[archivo.type];
    if (!ext) return setEstado({ fase: "error", mensaje: "Solo PDF, XML o foto (JPG, PNG, WebP)." });
    if (archivo.size > MAX) return setEstado({ fase: "error", mensaje: "El archivo pesa más de 5 MB." });
    setEstado({ fase: "subiendo", nombre: archivo.name });
    const hoy = new Date();
    const nueva = `${hoy.getFullYear()}/${String(hoy.getMonth() + 1).padStart(2, "0")}/${crypto.randomUUID()}.${ext}`;
    const { error } = await crearClienteNavegador().storage.from("facturas").upload(nueva, archivo, { contentType: archivo.type });
    if (error) return setEstado({ fase: "error", mensaje: "No se pudo subir. Intenta de nuevo." });
    setEstado({ fase: "listo", nombre: archivo.name });
    onCambio(nueva);
  };

  const elegir = (lista: FileList | null) => {
    const archivo = lista?.[0];
    if (archivo) void subir(archivo);
  };

  return (
    <div>
      <input type="hidden" name="factura_archivo" value={ruta} />
      {estado.fase === "listo" || estado.fase === "subiendo" ? (
        <div className="flex items-center gap-3 rounded-2xl border border-white/60 bg-card px-3 py-2.5 shadow-sm">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-ergon-blue">
            <FileText className="size-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold text-ergon-navy">{estado.nombre}</span>
            {estado.fase === "subiendo" ? (
              <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-ergon-navy/10" aria-hidden>
                <span className="barra-indeterminada block h-full w-1/3 rounded-full bg-ergon-blue" />
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs font-bold text-exito">
                <CircleCheck className="size-3.5" aria-hidden /> Lista
              </span>
            )}
          </span>
          {estado.fase === "subiendo" ? (
            <LoaderCircle className="size-4 animate-spin text-muted-foreground" aria-label="Subiendo" />
          ) : (
            <>
              {ruta ? (
                <button type="button" onClick={() => abrirFactura(ruta)} className="rounded-full px-2.5 py-1 text-xs font-bold text-primary hover:bg-accent">
                  Ver
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onCambio("");
                  setEstado({ fase: "vacio" });
                }}
                className="grid size-8 place-items-center rounded-full text-muted-foreground hover:bg-error/10 hover:text-error"
                aria-label="Quitar factura"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => input.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setEncima(true);
          }}
          onDragLeave={() => setEncima(false)}
          onDrop={(e) => {
            e.preventDefault();
            setEncima(false);
            elegir(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-dashed px-4 py-5 text-center transition-[border-color,background-color,transform] duration-150",
            encima ? "-translate-y-0.5 border-ergon-blue bg-accent" : "border-ergon-navy/15 hover:border-ergon-blue/50 hover:bg-accent/60",
          )}
        >
          <UploadCloud className={cn("size-6 transition-transform", encima ? "scale-110 text-ergon-blue" : "text-muted-foreground")} aria-hidden />
          <span className="text-sm font-bold text-ergon-navy">Arrastra la factura o toca para elegirla</span>
          <span className="text-xs text-muted-foreground">PDF, XML o foto · máx. 5 MB</span>
          {estado.fase === "error" ? (
            <span role="alert" className="mt-1 text-xs font-bold text-error">
              {estado.mensaje}
            </span>
          ) : null}
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept=".pdf,.xml,image/jpeg,image/png,image/webp,application/pdf,text/xml,application/xml"
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          elegir(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
