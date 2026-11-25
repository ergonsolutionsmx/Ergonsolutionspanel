import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { Pendiente, Titulo } from "@/components/panel/titulo";

export const metadata: Metadata = { title: "Demos" };

export default async function Page() {
  await obtenerUsuario();
  return (
    <>
      <Titulo>Demos</Titulo>
      <Pendiente fase={7} />
    </>
  );
}
