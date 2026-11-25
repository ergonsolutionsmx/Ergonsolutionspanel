import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Usuario = {
  id: string;
  nombre: string;
  correo: string;
  color: string;
};

/**
 * Capa de acceso: devuelve el usuario de la sesión con su perfil.
 * - Sin sesión → /login
 * - Con sesión pero sin perfil (no es Jorge ni Antonio) → se cierra la sesión.
 * Se llama en cada página del panel (no confiar solo en proxy.ts).
 */
export const obtenerUsuario = cache(async (): Promise<Usuario> => {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const id = data?.claims?.sub;
  if (!id) redirect("/login");

  const { data: perfil } = await supabase
    .from("perfiles")
    .select("usuario_id, nombre, correo, color")
    .eq("usuario_id", id)
    .maybeSingle();

  if (!perfil) redirect("/auth/salir?error=sin-acceso");

  return {
    id: perfil.usuario_id,
    nombre: perfil.nombre,
    correo: perfil.correo,
    color: perfil.color,
  };
});

/** Evita redirecciones abiertas: solo rutas internas. */
export function rutaSegura(ruta: unknown, porDefecto = "/inicio") {
  if (typeof ruta !== "string") return porDefecto;
  if (!ruta.startsWith("/") || ruta.startsWith("//") || ruta.startsWith("/\\")) return porDefecto;
  return ruta;
}
