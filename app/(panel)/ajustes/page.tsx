import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { FormularioPerfil } from "@/components/ajustes/formulario-perfil";
import { SeccionAjustes } from "@/components/ajustes/seccion";

export const metadata: Metadata = { title: "Perfil" };

export default async function AjustesPerfilPage() {
  const usuario = await obtenerUsuario();
  return (
    <SeccionAjustes titulo="Perfil" descripcion="Tu nombre y color se usan en las iniciales de todo el panel.">
      <FormularioPerfil nombre={usuario.nombre} color={usuario.color} correo={usuario.correo} />
    </SeccionAjustes>
  );
}
