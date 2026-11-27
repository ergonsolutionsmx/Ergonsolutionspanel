import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { Clock, Download } from "lucide-react";
import { LOCALE, ZONA_HORARIA, pesos } from "@/lib/utils";
import { esMiembroConSesion, obtenerPropuestaPublica } from "@/lib/propuestas";
import { hayPreciosPorDefinir, type PropuestaParaCliente } from "@/lib/propuestas-tipos";

export const metadata: Metadata = {
  title: "Propuesta",
  description: "Propuesta de Ergon Solutions.",
  openGraph: { title: "Propuesta · Ergon Solutions", description: "Propuesta de Ergon Solutions." },
};

const fecha = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ergon-bg">
      <header className="bg-ergon-navy">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-5">
          <Image src="/brand/logo-fondo-oscuro.png" alt="Ergon Solutions" width={170} height={54} priority className="h-auto w-36 sm:w-44" />
        </div>
        <div className="h-1 bg-ergon-blue" />
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-3xl px-5 pb-10 text-xs text-muted-foreground">Ergon Solutions</footer>
    </div>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
      <Clock className="mx-auto mb-3 size-10 text-ergon-blue" aria-hidden />
      <h1 className="text-xl font-black text-ergon-navy">{titulo}</h1>
      <p className="mt-2 text-muted-foreground">{texto}</p>
    </div>
  );
}

function Contenido({ p, token }: { p: PropuestaParaCliente; token: string }) {
  const emitida = p.enviada_en ?? p.creado_en;
  return (
    <article className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-ergon-blue">Propuesta {p.folio}</p>
          <h1 className="mt-1 text-2xl font-black text-ergon-navy sm:text-3xl">Propuesta para {p.prospecto_nombre}</h1>
          {p.prospecto_negocio ? <p className="mt-1 text-muted-foreground">{p.prospecto_negocio}</p> : null}
        </div>
        <a
          href={`/p/${token}/pdf`}
          className="inline-flex h-11 items-center gap-2 rounded-md bg-ergon-blue px-4 text-sm font-bold text-white hover:bg-ergon-blue/90"
        >
          <Download className="size-4" aria-hidden /> Descargar PDF
        </a>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-md border-l-4 border-ergon-blue bg-card px-4 py-3 text-sm">
        <span>
          Fecha: <strong>{fecha(emitida)}</strong>
        </span>
        {p.vence_en ? (
          <span>
            Vigente hasta: <strong>{fecha(p.vence_en)}</strong>
          </span>
        ) : null}
      </div>

      {p.problema ? (
        <section>
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ergon-blue">Lo que detectamos</h2>
          <p className="whitespace-pre-line leading-relaxed">{p.problema}</p>
        </section>
      ) : null}
      {p.solucion ? (
        <section>
          <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ergon-blue">Lo que proponemos</h2>
          <p className="whitespace-pre-line leading-relaxed">{p.solucion}</p>
        </section>
      ) : null}

      <section>
        <h2 className="mb-2 text-sm font-black uppercase tracking-wide text-ergon-blue">Inversión</h2>
        <ul className="divide-y overflow-hidden rounded-lg border bg-card">
          {p.conceptos.map((c, i) => (
            <li key={i} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:gap-6">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-ergon-navy">{c.titulo}</p>
                {c.descripcion ? <p className="mt-1 text-sm text-muted-foreground">{c.descripcion}</p> : null}
              </div>
              <dl className="flex gap-6 text-sm sm:w-56 sm:justify-end sm:text-right">
                <div>
                  <dt className="text-xs text-muted-foreground">Instalación</dt>
                  <dd className="font-bold">{c.precio_instalacion !== null ? pesos(c.precio_instalacion) : "—"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Mensualidad</dt>
                  <dd className="font-bold">{c.precio_mensual !== null ? pesos(c.precio_mensual) : "—"}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-xs font-bold uppercase text-muted-foreground">Instalación (pago único)</p>
            <p className="mt-1 text-2xl font-black text-ergon-navy">{pesos(p.total_instalacion)}</p>
          </div>
          <div className="rounded-lg bg-ergon-navy p-4 text-white">
            <p className="text-xs font-bold uppercase text-ergon-sky">Mensualidad</p>
            <p className="mt-1 text-2xl font-black">{pesos(p.total_mensual)}</p>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Precios en pesos mexicanos (MXN).
          {hayPreciosPorDefinir(p.conceptos) ? " Los conceptos con — tienen precio por definir." : ""}
        </p>
      </section>
    </article>
  );
}

async function Propuesta({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  // Si la abre Jorge o Antonio con su sesión, no cuenta como "vista".
  const marcar = !(await esMiembroConSesion());
  const r = await obtenerPropuestaPublica(token, marcar);

  if (r.estado === "vencida") {
    return <Aviso titulo="Esta propuesta venció" texto={`La propuesta ${r.folio} ya no está vigente. Escríbenos y te la renovamos.`} />;
  }
  if (r.estado !== "ok") {
    return <Aviso titulo="Propuesta no encontrada" texto="Revisa que el link esté completo." />;
  }
  return <Contenido p={r.propuesta} token={token} />;
}

export default function PaginaPropuestaPublica({ params }: PageProps<"/p/[token]">) {
  return (
    <Marco>
      <Suspense fallback={<div className="h-64 motion-safe:animate-pulse rounded-lg bg-secondary" />}>
        <Propuesta params={params} />
      </Suspense>
    </Marco>
  );
}
