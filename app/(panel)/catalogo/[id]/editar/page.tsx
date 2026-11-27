import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerServicio } from "@/lib/catalogo";
import { FormularioServicio } from "@/components/catalogo/formulario-servicio";
import { EditorVariantes } from "@/components/catalogo/editor-variantes";
import { actualizarServicio } from "../../acciones";

export const metadata: Metadata = { title: "Editar servicio" };

export default async function EditarServicioPage({ params }: PageProps<"/catalogo/[id]/editar">) {
  await obtenerUsuario();
  const { id } = await params;
  const s = await obtenerServicio(id);
  if (!s) notFound();

  return (
    <div className="max-w-3xl">
      <Link href={`/catalogo/${s.id}`} className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Ver ficha
      </Link>
      <h1 className="mb-6 text-2xl font-black text-ergon-navy">
        Editar {s.numero} · {s.nombre}
      </h1>
      <div className="mb-8 rounded-lg border bg-card p-4 md:p-6">
        <FormularioServicio accion={actualizarServicio.bind(null, s.id)} servicio={s} cancelar={`/catalogo/${s.id}`} textoBoton="Guardar" />
      </div>
      <h2 id="variantes" className="mb-3 text-lg font-black text-ergon-navy">
        Variantes y precios
      </h2>
      <EditorVariantes servicioId={s.id} variantes={s.variantes} />
    </div>
  );
}
