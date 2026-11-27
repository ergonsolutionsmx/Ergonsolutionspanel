import "server-only";
import { crearClienteAdmin } from "@/lib/supabase/admin";
import type { MensajeEntrante } from "@/lib/inbox/tipos";

export type ResultadoIngreso = "creado" | "duplicado" | "limite" | "error";

/** Guarda un mensaje externo (con la llave de servicio): no duplica y aplica límite por IP. */
export async function ingresarMensaje(m: MensajeEntrante, ip: string | null = null): Promise<ResultadoIngreso> {
  const supabase = crearClienteAdmin();
  const { data, error } = await supabase.rpc("inbox_ingresar", {
    p_canal: m.canal,
    p_externo_id: m.externoId,
    p_nombre: m.nombre,
    p_contacto: m.contacto,
    p_asunto: m.asunto,
    p_cuerpo: m.cuerpo,
    p_crudos: m.crudos,
    p_ip: ip,
  });
  if (error || !data) return "error";
  return ((data as { resultado?: ResultadoIngreso }).resultado ?? "error") as ResultadoIngreso;
}

/** IP del cliente detrás de Vercel u otro proxy. */
export function ipDe(request: Request) {
  const reenviada = request.headers.get("x-forwarded-for");
  return (reenviada?.split(",")[0] ?? request.headers.get("x-real-ip") ?? "").trim() || "desconocida";
}
