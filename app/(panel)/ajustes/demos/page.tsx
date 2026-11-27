import type { Metadata } from "next";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerDemos } from "@/lib/demos";
import { EditorDemos } from "@/components/demos/editor-demos";

export const metadata: Metadata = { title: "Demos" };

export default async function AjustesDemosPage() {
  await obtenerUsuario();
  const demos = await obtenerDemos({ soloActivas: false });
  return <EditorDemos demos={demos} />;
}
