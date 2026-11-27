import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Preferencias } from "@/components/ajustes/preferencias";
import { SeccionAjustes } from "@/components/ajustes/seccion";
import { ProbarNotificaciones } from "../probar-notificaciones";

export const metadata: Metadata = { title: "Notificaciones" };

export default async function AjustesNotificacionesPage() {
  const usuario = await obtenerUsuario();
  const supabase = await crearClienteServidor();
  const [{ data: perfil }, { data: usuarios }] = await Promise.all([
    supabase.from("perfiles").select("preferencias").eq("usuario_id", usuario.id).maybeSingle(),
    supabase.from("perfiles").select("usuario_id, nombre").order("nombre"),
  ]);
  return (
    <div className="grid gap-4">
      <SeccionAjustes titulo="Qué te avisamos" descripcion="Elige qué notificaciones llegan a tu campanita.">
        <Preferencias preferencias={(perfil?.preferencias as Record<string, boolean>) ?? {}} />
      </SeccionAjustes>
      <SeccionAjustes titulo="Probar notificaciones" descripcion="Manda un aviso de prueba para revisar que lleguen.">
        <ProbarNotificaciones usuarios={usuarios ?? []} yoId={usuario.id} />
      </SeccionAjustes>
    </div>
  );
}
