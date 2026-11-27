import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerPropuesta } from "@/lib/propuestas";
import { obtenerServicios } from "@/lib/catalogo";
import { fechaCorta, hoyISO, partesCDMX, rangoDias } from "@/lib/fechas";
import { haceCuanto } from "@/lib/tiempo";
import { Badge } from "@/components/ui/badge";
import { EtiquetaEstadoPropuesta } from "@/components/propuestas/etiqueta-estado";
import { FormularioProspecto } from "@/components/propuestas/formulario-prospecto";
import { EditorConceptos } from "@/components/propuestas/conceptos";
import { PanelAcciones } from "@/components/propuestas/panel-acciones";
import { actualizarPropuesta } from "../acciones";

export const metadata: Metadata = { title: "Propuesta" };

export default async function PropuestaPage({ params }: PageProps<"/propuestas/[id]">) {
  await obtenerUsuario();
  const { id } = await params;
  const [datos, servicios] = await Promise.all([obtenerPropuesta(id), obtenerServicios()]);
  if (!datos) notFound();
  const { propuesta: p, conceptos } = datos;
  const hoy = hoyISO();

  // Textos de vigencia calculados aquí (hora CDMX) para no depender del reloj del navegador.
  let textoVigencia: string | null = null;
  let vencida = p.estado === "vencida";
  if (p.vence_en && p.estado !== "borrador") {
    const vence = partesCDMX(p.vence_en).fecha;
    vencida = vencida || (new Date(p.vence_en) < new Date() && (p.estado === "enviada" || p.estado === "vista"));
    const dias = rangoDias(hoy, vence).length - 1;
    textoVigencia = vencida
      ? `Venció el ${fechaCorta(vence, hoy)}. El link muestra "Esta propuesta venció".`
      : `Vence el ${fechaCorta(vence, hoy)} (${dias === 0 ? "hoy" : dias === 1 ? "mañana" : `en ${dias} días`}).`;
  }
  const textoVista = p.vista_en ? `La abrió ${haceCuanto(p.vista_en)}.` : p.estado === "enviada" ? "Aún no la abre." : null;

  return (
    <>
      <Link href="/propuestas" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Propuestas
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-black text-ergon-navy">{p.folio}</h1>
        <EtiquetaEstadoPropuesta estado={vencida ? "vencida" : p.estado} />
        {p.archivada ? <Badge className="bg-slate-800 text-white">Archivada</Badge> : null}
        <span className="text-sm text-muted-foreground">
          {p.prospecto_nombre}
          {p.prospecto_negocio ? ` · ${p.prospecto_negocio}` : ""}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid min-w-0 gap-6">
          <section aria-labelledby="t-prospecto">
            <h2 id="t-prospecto" className="mb-3 text-lg font-black text-ergon-navy">
              Prospecto
            </h2>
            <div className="rounded-lg border border-white/70 bg-card p-4 md:p-6">
              <FormularioProspecto accion={actualizarPropuesta.bind(null, p.id)} propuesta={p} textoBoton="Guardar datos" />
            </div>
          </section>
          <section aria-labelledby="t-conceptos">
            <h2 id="t-conceptos" className="mb-3 text-lg font-black text-ergon-navy">
              Servicios y precios
            </h2>
            <EditorConceptos
              propuestaId={p.id}
              conceptos={conceptos}
              servicios={servicios.filter((s) => s.activo)}
              totalInstalacion={p.total_instalacion}
              totalMensual={p.total_mensual}
            />
          </section>
        </div>
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <PanelAcciones
            id={p.id}
            estado={p.estado}
            token={p.token_publico}
            archivada={p.archivada}
            textoVigencia={textoVigencia}
            textoVista={textoVista}
            vencida={vencida}
          />
        </aside>
      </div>
    </>
  );
}
