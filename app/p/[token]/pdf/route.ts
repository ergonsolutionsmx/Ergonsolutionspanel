import { obtenerPropuestaPublica } from "@/lib/propuestas";
import { respuestaPdf } from "@/lib/pdf/respuesta";

/** PDF desde el link público: respeta el vencimiento y no vuelve a marcar "vista". */
export async function GET(_request: Request, { params }: RouteContext<"/p/[token]/pdf">) {
  const { token } = await params;
  const r = await obtenerPropuestaPublica(token, false);
  if (r.estado === "vencida") return new Response("Esta propuesta venció", { status: 410 });
  if (r.estado !== "ok") return new Response("Propuesta no encontrada", { status: 404 });
  return respuestaPdf(r.propuesta);
}
