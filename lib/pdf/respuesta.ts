import "server-only";
import { generarPdfPropuesta, nombreArchivoPdf } from "@/lib/pdf/propuesta";
import type { PropuestaParaCliente } from "@/lib/propuestas-tipos";

/** Respuesta HTTP con el PDF de la propuesta para descargar. */
export async function respuestaPdf(p: PropuestaParaCliente) {
  const pdf = await generarPdfPropuesta(p);
  const nombre = nombreArchivoPdf(p.folio);
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${nombre.replace(/[^\x20-\x7E]/g, "")}"; filename*=UTF-8''${encodeURIComponent(nombre)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
