import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CanalesBandeja } from "@/components/bandeja/canales";
import { ProbarNotificaciones } from "../probar-notificaciones";

export const metadata: Metadata = { title: "Canales" };

export default async function AjustesCanalesPage() {
  const usuario = await obtenerUsuario();
  const supabase = await crearClienteServidor();
  const { data: usuarios } = await supabase.from("perfiles").select("usuario_id, nombre").order("nombre");
  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Canales de la bandeja</CardTitle>
        </CardHeader>
        <CardContent>
          <CanalesBandeja />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Probar notificaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <ProbarNotificaciones usuarios={usuarios ?? []} yoId={usuario.id} />
        </CardContent>
      </Card>
    </div>
  );
}
