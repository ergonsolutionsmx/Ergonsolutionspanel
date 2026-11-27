import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";

export type Demo = {
  id: string;
  nombre: string;
  descripcion: string | null;
  url: string | null;
  orden: number;
  activo: boolean;
};

export async function obtenerDemos({ soloActivas }: { soloActivas: boolean }): Promise<Demo[]> {
  const supabase = await crearClienteServidor();
  let q = supabase.from("demos").select("id, nombre, descripcion, url, orden, activo").order("orden").order("nombre");
  if (soloActivas) q = q.eq("activo", true);
  const { data } = await q;
  return (data ?? []) as Demo[];
}
