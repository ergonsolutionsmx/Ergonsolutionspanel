import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pendiente, Titulo } from "@/components/panel/titulo";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ProbarNotificaciones } from "./probar-notificaciones";
import { CanalesBandeja } from "@/components/bandeja/canales";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const usuario = await obtenerUsuario();
  const supabase = await crearClienteServidor();
  const { data: usuarios } = await supabase.from("perfiles").select("usuario_id, nombre").order("nombre");

  return (
    <>
      <Titulo>Ajustes</Titulo>
      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Cuenta</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-bold">{usuario.nombre}</p>
              <p className="text-sm text-muted-foreground">{usuario.correo}</p>
            </div>
            <form action={cerrarSesion}>
              <Button type="submit" variant="outline">
                <LogOut /> Cerrar sesión
              </Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Notificaciones</CardTitle>
          </CardHeader>
          <CardContent>
            <ProbarNotificaciones usuarios={usuarios ?? []} yoId={usuario.id} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Canales de la bandeja</CardTitle>
          </CardHeader>
          <CardContent>
            <CanalesBandeja />
          </CardContent>
        </Card>
        <Pendiente fase={7} />
      </div>
    </>
  );
}
