import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { FormularioPerfil } from "@/components/ajustes/formulario-perfil";
import { SeccionAjustes } from "@/components/ajustes/seccion";
import { SelectorTema } from "@/components/tema/tema";

export const metadata: Metadata = { title: "Perfil" };

export default async function AjustesPerfilPage() {
  const usuario = await obtenerUsuario();
  return (
    <div className="grid gap-4">
      <SeccionAjustes titulo="Perfil" descripcion="Tu nombre y color se usan en las iniciales de todo el panel.">
        <FormularioPerfil nombre={usuario.nombre} color={usuario.color} correo={usuario.correo} />
      </SeccionAjustes>
      <SeccionAjustes titulo="Apariencia" descripcion="Automático sigue el modo de tu celular o computadora. Se guarda en este dispositivo.">
        <SelectorTema />
      </SeccionAjustes>
    </div>
  );
}
