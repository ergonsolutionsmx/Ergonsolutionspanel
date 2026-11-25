import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { Pendiente, Titulo } from "@/components/panel/titulo";

export const metadata: Metadata = { title: "Proyectos" };

export default async function Page() {
  await obtenerUsuario();
  return (
    <>
      <Titulo>Proyectos</Titulo>
      <Pendiente fase={2} />
    </>
  );
}
