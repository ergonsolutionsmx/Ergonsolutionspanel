import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { CheckCircle2, Clock, Download } from "lucide-react";
import { LOCALE, ZONA_HORARIA } from "@/lib/utils";
import { esMiembroConSesion, obtenerPropuestaPublica } from "@/lib/propuestas";
import type { PropuestaParaCliente } from "@/lib/propuestas-tipos";
import { Factura } from "@/components/propuestas/factura";
import { BotonAceptar } from "./aceptar";

export const metadata: Metadata = {
  title: "Propuesta",
  description: "Propuesta de Ergon Solutions.",
  openGraph: { title: "Propuesta · Ergon Solutions", description: "Propuesta de Ergon Solutions." },
};

const fecha = (iso: string) =>
  new Intl.DateTimeFormat(LOCALE, { timeZone: ZONA_HORARIA, day: "numeric", month: "long", year: "numeric" }).format(new Date(iso));

function Marco({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="relative overflow-hidden bg-ergon-navy">
        <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-ergon-sky/25 blur-3xl" aria-hidden />
        <div className="relative mx-auto flex max-w-3xl items-center justify-between px-5 py-6">
          <Image src="/brand/logo-fondo-oscuro.png" alt="Ergon Solutions" width={170} height={54} priority className="logo-entrada h-auto w-36 sm:w-44" />
        </div>
        <div className="h-1 bg-gradient-to-r from-ergon-blue to-ergon-sky" />
      </header>
      <main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
      <footer className="mx-auto max-w-3xl px-5 pb-10 text-xs text-muted-foreground">Ergon Solutions · Precios en pesos mexicanos (MXN)</footer>
    </div>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/70 bg-card p-8 text-center shadow-md">
      <Clock className="mx-auto mb-3 size-10 text-ergon-blue" aria-hidden />
      <h1 className="text-xl font-black text-ergon-navy">{titulo}</h1>
      <p className="mt-2 text-muted-foreground">{texto}</p>
    </div>
  );
}

function Contenido({ p, token, estado }: { p: PropuestaParaCliente; token: string; estado: string }) {
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
          className="inline-flex h-11 items-center gap-2 rounded-full border border-input bg-card px-5 text-sm font-bold text-ergon-navy shadow-sm hover:bg-accent"
        >
          <Download className="size-4" aria-hidden /> Descargar PDF
        </a>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-1 rounded-2xl border-l-4 border-ergon-blue bg-card px-4 py-3 text-sm shadow-sm">
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
        <Factura p={p} />
      </section>

      <section className="flex flex-col items-center gap-2 rounded-[1.5rem] border border-white/70 bg-card p-6 text-center shadow-sm">
        {estado === "aceptada" ? (
          <p className="flex items-center gap-2 text-sm font-bold text-exito">
            <CheckCircle2 className="size-5" aria-hidden /> Esta propuesta ya fue aceptada. ¡Gracias!
          </p>
        ) : estado === "rechazada" ? (
          <p className="text-sm text-muted-foreground">Esta propuesta quedó cerrada. Escríbenos si quieres retomarla.</p>
        ) : (
          <>
            <p className="font-black text-ergon-navy">¿Todo bien?</p>
            <p className="mb-2 text-sm text-muted-foreground">Acepta la propuesta y te contactamos para empezar.</p>
            <BotonAceptar token={token} folio={p.folio} />
          </>
        )}
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
    return <Aviso titulo="Esta propuesta venció" texto={`La propuesta ${r.folio} ya no está vigente; pide una nueva y con gusto te la renovamos.`} />;
  }
  if (r.estado !== "ok") {
    return <Aviso titulo="Propuesta no encontrada" texto="Revisa que el link esté completo." />;
  }
  return <Contenido p={r.propuesta} token={token} estado={r.estadoPropuesta} />;
}

export default function PaginaPropuestaPublica({ params }: PageProps<"/p/[token]">) {
  return (
    <Marco>
      <Suspense fallback={<div className="esqueleto h-64 rounded-[1.5rem]" />}>
        <Propuesta params={params} />
      </Suspense>
    </Marco>
  );
}
