import { redirect } from "next/navigation";

/** Demos ahora vive dentro de Catálogo. */
export default function DemosPage() {
  redirect("/catalogo?vista=demos");
}
