import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { fechaLarga } from "@/lib/utils";
import { Pendiente } from "@/components/panel/titulo";

export const metadata: Metadata = { title: "Inicio" };

export default async function InicioPage() {
  const usuario = await obtenerUsuario();
  const nombre = usuario.nombre.split(" ")[0];
  const fecha = fechaLarga();

  return (
    <>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-ergon-navy">Hola, {nombre}</h1>
        <p className="mt-1 text-muted-foreground">{fecha}</p>
      </div>
      <Pendiente fase={1} />
    </>
  );
}
