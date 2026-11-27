import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { Button } from "@/components/ui/button";
import { FormularioContrasena } from "@/components/ajustes/formulario-contrasena";
import { CerrarOtrasSesiones } from "@/components/ajustes/cerrar-otras";
import { SeccionAjustes } from "@/components/ajustes/seccion";

export const metadata: Metadata = { title: "Seguridad" };

export default function AjustesSeguridadPage() {
  return (
    <div className="grid gap-4">
      <SeccionAjustes titulo="Contraseña" descripcion="Pide tu contraseña actual antes de cambiarla.">
        <FormularioContrasena />
      </SeccionAjustes>
      <SeccionAjustes titulo="Sesiones" descripcion="Si entraste en otra computadora o celular, puedes cerrar esas sesiones.">
        <div className="flex flex-wrap gap-2">
          <CerrarOtrasSesiones />
          <form action={cerrarSesion}>
            <Button type="submit" variant="ghost">
              <LogOut /> Cerrar sesión aquí
            </Button>
          </form>
        </div>
      </SeccionAjustes>
    </div>
  );
}
