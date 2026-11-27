import { obtenerUsuario } from "@/lib/auth";
import { obtenerPropuesta } from "@/lib/propuestas";
import { paraCliente } from "@/lib/propuestas-tipos";
import { respuestaPdf } from "@/lib/pdf/respuesta";

/** PDF de la propuesta (requiere sesión). */
export async function GET(_request: Request, { params }: RouteContext<"/propuestas/[id]/pdf">) {
  await obtenerUsuario();
  const { id } = await params;
  const datos = await obtenerPropuesta(id);
  if (!datos) return new Response("Propuesta no encontrada", { status: 404 });
  return respuestaPdf(paraCliente(datos.propuesta, datos.conceptos));
}
