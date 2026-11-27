import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormularioPerfil } from "@/components/ajustes/formulario-perfil";
import { FormularioContrasena } from "@/components/ajustes/formulario-contrasena";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesCuentaPage() {
  const usuario = await obtenerUsuario();
  return (
    <div className="grid max-w-2xl gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioPerfil nombre={usuario.nombre} color={usuario.color} correo={usuario.correo} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Contraseña</CardTitle>
        </CardHeader>
        <CardContent>
          <FormularioContrasena />
        </CardContent>
      </Card>
      <form action={cerrarSesion}>
        <Button type="submit" variant="ghost">
          <LogOut /> Cerrar sesión
        </Button>
      </form>
    </div>
  );
}
