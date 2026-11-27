import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowLeftIcon } from "lucide-react";
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
import { paraCliente } from "@/lib/propuestas-tipos";
import { Stepper } from "@/components/ui/stepper";
import { Button } from "@/components/ui/button";
import { Factura } from "@/components/propuestas/factura";
import { InterruptorIva } from "@/components/propuestas/interruptor-iva";
import { ArrowRight } from "lucide-react";

const PASOS = [
  { valor: "cliente", nombre: "Cliente" },
  { valor: "servicios", nombre: "Servicios" },
  { valor: "revision", nombre: "Revisión" },
  { valor: "enviar", nombre: "Enviar" },
] as const;
type Paso = (typeof PASOS)[number]["valor"];

export const metadata: Metadata = { title: "Propuesta" };

export default async function PropuestaPage({ params, searchParams }: PageProps<"/propuestas/[id]">) {
  await obtenerUsuario();
  const [{ id }, sp] = await Promise.all([params, searchParams]);
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
  // Paso actual: el de la URL; si no, borrador → servicios (o cliente si no hay datos) y enviada → enviar.
  const pasoUrl = typeof sp.paso === "string" ? sp.paso : "";
  const paso: Paso = (PASOS.some((x) => x.valor === pasoUrl) ? pasoUrl : p.estado === "borrador" ? (conceptos.length ? "revision" : "servicios") : "enviar") as Paso;
  const i = PASOS.findIndex((x) => x.valor === paso);
  const anterior = PASOS[i - 1]?.valor;
  const siguiente = PASOS[i + 1]?.valor;
  const textoVista = p.vista_en ? `La abrió ${haceCuanto(p.vista_en)}.` : p.estado === "enviada" ? "Aún no la abre." : null;

  return (
    <>
      <Link href="/propuestas" className="mb-3 inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline">
        <ArrowLeft className="size-4" aria-hidden /> Propuestas
      </Link>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h1 className="font-mono text-2xl font-black tracking-tight text-ergon-navy">{p.folio}</h1>
        <EtiquetaEstadoPropuesta estado={vencida ? "vencida" : p.estado} />
        {p.archivada ? <Badge className="bg-slate-800 text-white">Archivada</Badge> : null}
        <span className="text-sm text-muted-foreground">
          {p.prospecto_nombre}
          {p.prospecto_negocio ? ` · ${p.prospecto_negocio}` : ""}
        </span>
      </div>

      <div className="mb-5">
        <Stepper actual={paso} pasos={PASOS.map((x) => ({ valor: x.valor, nombre: x.nombre, href: `/propuestas/${p.id}?paso=${x.valor}` }))} />
      </div>

      <div className="grid gap-4">
        {paso === "cliente" ? (
          <section aria-labelledby="t-prospecto" className="rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm md:p-6">
            <h2 id="t-prospecto" className="mb-4 text-lg font-black text-ergon-navy">
              Datos del cliente
            </h2>
            <FormularioProspecto accion={actualizarPropuesta.bind(null, p.id)} propuesta={p} textoBoton="Guardar datos" />
          </section>
        ) : null}

        {paso === "servicios" ? (
          <section aria-labelledby="t-conceptos">
            <h2 id="t-conceptos" className="mb-3 text-lg font-black text-ergon-navy">
              Servicios del catálogo
            </h2>
            <EditorConceptos
              propuestaId={p.id}
              conceptos={conceptos}
              servicios={servicios.filter((s) => s.activo)}
              totalInstalacion={p.total_instalacion}
              totalMensual={p.total_mensual}
            />
          </section>
        ) : null}

        {paso === "revision" ? (
          <section aria-labelledby="t-revision" className="grid gap-3">
            <h2 id="t-revision" className="text-lg font-black text-ergon-navy">
              Revisión
            </h2>
            <InterruptorIva id={p.id} conIva={p.con_iva} />
            {conceptos.length ? (
              <Factura p={paraCliente(p, conceptos)} />
            ) : (
              <p className="rounded-[1.25rem] border border-dashed p-6 text-center text-sm text-muted-foreground">Agrega servicios en el paso anterior.</p>
            )}
          </section>
        ) : null}

        {paso === "enviar" ? (
          <section aria-label="Enviar" className="max-w-xl">
            <PanelAcciones
              id={p.id}
              estado={p.estado}
              token={p.token_publico}
              archivada={p.archivada}
              textoVigencia={textoVigencia}
              textoVista={textoVista}
              vencida={vencida}
            />
          </section>
        ) : null}

        <div className="flex items-center justify-between gap-2">
          {anterior ? (
            <Button asChild variant="ghost">
              <Link href={`/propuestas/${p.id}?paso=${anterior}`} scroll={false}>
                <ArrowLeftIcon /> Anterior
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {siguiente ? (
            <Button asChild>
              <Link href={`/propuestas/${p.id}?paso=${siguiente}`} scroll={false}>
                Siguiente <ArrowRight />
              </Link>
            </Button>
          ) : null}
        </div>
      </div>
    </>
  );
}
