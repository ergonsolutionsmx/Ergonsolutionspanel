import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { leerFiltrosBandeja, obtenerMensajes } from "@/lib/bandeja";
import { haceCuanto } from "@/lib/tiempo";
import { Titulo } from "@/components/panel/titulo";
import { ListaMensajes } from "@/components/bandeja/lista-mensajes";
import { FiltrosBandejaChips, qsBandeja } from "@/components/bandeja/filtros";

export const metadata: Metadata = { title: "Bandeja" };

export default async function BandejaPage({ searchParams }: PageProps<"/bandeja">) {
  const usuario = await obtenerUsuario();
  const f = leerFiltrosBandeja(await searchParams);
  const [mensajes, { perfiles }] = await Promise.all([obtenerMensajes(f, usuario.id), obtenerCatalogos(usuario.id)]);
  const hace = Object.fromEntries(mensajes.map((m) => [m.id, haceCuanto(m.recibido_en)]));

  return (
    <>
      <Titulo>Bandeja</Titulo>
      <FiltrosBandejaChips f={f} perfiles={perfiles} yoId={usuario.id} />
      <ListaMensajes mensajes={mensajes} perfiles={perfiles} hace={hace} qs={qsBandeja(f)} />
    </>
  );
}
