import Link from "next/link";
import { cn } from "@/lib/utils";
import { diaCorto, diaLargo, mayuscula, partesCDMX, rangoDias, sumarDias } from "@/lib/fechas";
import type { ItemAgenda } from "@/lib/agenda-tipos";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { CalendarioPared, Leyenda } from "@/components/ui/three-dwall-calendar";
import { ItemAgendaFila } from "./item";
import { ColumnaHoras, PX_HORA, SinHora, rangoHoras } from "./franjas";

type Comun = {
  porDia: Record<string, ItemAgenda[]>;
  volver: string;
  hoy: string;
  perfiles: PerfilCorto[];
  /** Arma la URL de la agenda con otros parámetros (p. ej. ir a un día). */
  hrefDia: (fecha: string) => string;
  /** URL para crear algo en un día. */
  hrefNuevo: (fecha: string) => string;
};

function ahoraMinutos() {
  const { hora } = partesCDMX(new Date().toISOString());
  return Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
}

function Vacio({ texto = "Nada en este día", href }: { texto?: string; href?: string }) {
  return (
    <div className="rounded-2xl border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
      {texto}
      {href ? (
        <>
          {" · "}
          <Link href={href} className="font-bold text-primary hover:underline">
            Agregar
          </Link>
        </>
      ) : null}
    </div>
  );
}

/** Etiquetas de hora a la izquierda de las franjas. */
function Horas({ desde, hasta }: { desde: number; hasta: number }) {
  return (
    <div className="relative w-12 shrink-0" style={{ height: (hasta - desde) * PX_HORA }} aria-hidden>
      {Array.from({ length: hasta - desde }, (_, i) => (
        <span key={i} className="absolute right-2 -translate-y-1/2 text-[11px] font-bold tabular-nums text-muted-foreground" style={{ top: i * PX_HORA }}>
          {i === 0 ? "" : `${desde + i}:00`}
        </span>
      ))}
    </div>
  );
}

export function VistaDia({ fecha, ...p }: Comun & { fecha: string }) {
  const items = p.porDia[fecha] ?? [];
  const { desde, hasta } = rangoHoras([items]);
  const comun = { perfiles: p.perfiles, volver: p.volver, hoy: p.hoy };
  return (
    <div className="rounded-[1.25rem] border border-white/70 bg-card p-3 shadow-sm md:p-4">
      {items.length === 0 ? (
        <p className="mb-3 text-sm text-muted-foreground">
          Nada en este día.{" "}
          <Link href={p.hrefNuevo(fecha)} className="font-bold text-primary hover:underline">
            Agregar
          </Link>
        </p>
      ) : null}
      <div className="mb-3 empty:hidden">
        <SinHora items={items} {...comun} />
      </div>
      <div className="flex">
        <Horas desde={desde} hasta={hasta} />
        <div className="min-w-0 flex-1 border-l border-ergon-navy/10">
          <ColumnaHoras items={items} desde={desde} hasta={hasta} esHoy={fecha === p.hoy} ahoraMin={ahoraMinutos()} {...comun} />
        </div>
      </div>
      <Leyenda />
    </div>
  );
}

export function VistaSemana({ desde, ...p }: Comun & { desde: string }) {
  const dias = rangoDias(desde, sumarDias(desde, 6));
  const rango = rangoHoras(dias.map((d) => p.porDia[d] ?? []));
  const comun = { perfiles: p.perfiles, volver: p.volver, hoy: p.hoy };
  const ahora = ahoraMinutos();
  return (
    <>
      {/* Computadora: 7 columnas con franjas por hora */}
      <div className="hidden overflow-hidden rounded-[1.25rem] border border-white/70 bg-card p-3 shadow-sm md:block">
        <div className="flex">
          <div className="w-12 shrink-0" />
          <div className="grid flex-1 grid-cols-7">
            {dias.map((dia) => {
              const esHoy = dia === p.hoy;
              return (
                <div key={dia} className="border-l border-ergon-navy/10 px-1 pb-2">
                  <Link href={p.hrefDia(dia)} className="flex flex-col items-center rounded-xl py-1 hover:bg-muted">
                    <span className="text-[11px] font-bold uppercase text-muted-foreground">{diaCorto(dia).replace(".", "")}</span>
                    <span className={cn("flex size-8 items-center justify-center rounded-full text-base font-black", esHoy ? "bg-ergon-blue text-white" : "text-ergon-navy")}>
                      {Number(dia.slice(8))}
                    </span>
                  </Link>
                  <div className="mt-1">
                    <SinHora items={p.porDia[dia] ?? []} {...comun} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex border-t border-ergon-navy/10 pt-2">
          <Horas desde={rango.desde} hasta={rango.hasta} />
          <div className="grid flex-1 grid-cols-7">
            {dias.map((dia) => (
              <div key={dia} className="border-l border-ergon-navy/10">
                <ColumnaHoras items={p.porDia[dia] ?? []} desde={rango.desde} hasta={rango.hasta} esHoy={dia === p.hoy} ahoraMin={ahora} {...comun} />
              </div>
            ))}
          </div>
        </div>
        <Leyenda />
      </div>

      {/* Celular: lista por día */}
      <div className="space-y-2 md:hidden">
        {dias.map((dia) => {
          const items = p.porDia[dia] ?? [];
          const esHoy = dia === p.hoy;
          return (
            <section key={dia} aria-label={mayuscula(diaLargo(dia))} className={cn("rounded-2xl border border-white/70 bg-card p-3 shadow-sm", esHoy && "ring-2 ring-ergon-blue")}>
              <Link href={p.hrefDia(dia)} className="mb-1 flex items-baseline gap-2">
                <span className="text-xs font-bold uppercase text-muted-foreground">{diaCorto(dia).replace(".", "")}</span>
                <span className={cn("text-lg font-black", esHoy ? "text-ergon-blue" : "text-ergon-navy")}>{Number(dia.slice(8))}</span>
              </Link>
              {items.length ? (
                <ul className="space-y-1.5">
                  {items.map((item) => (
                    <li key={`${item.tipo}-${item.id}`}>
                      <ItemAgendaFila item={item} {...comun} />
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">Libre</p>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}

export function VistaMes({ desde, hasta, mes, ...p }: Comun & { desde: string; hasta: string; mes: string }) {
  const dias = rangoDias(desde, hasta);
  return (
    <CalendarioPared
      dias={dias}
      mes={mes}
      porDia={p.porDia}
      hoy={p.hoy}
      perfiles={p.perfiles}
      volver={p.volver}
      hrefsDia={Object.fromEntries(dias.map((d) => [d, p.hrefDia(d)]))}
      hrefNuevo={Object.fromEntries(dias.map((d) => [d, p.hrefNuevo(d)]))}
    />
  );
}

export function VistaLista({ desde, hasta, ...p }: Comun & { desde: string; hasta: string }) {
  const dias = rangoDias(desde, hasta).filter((d) => p.porDia[d]?.length);
  if (!dias.length) return <Vacio texto="Nada en los próximos días" href={p.hrefNuevo(p.hoy)} />;
  return (
    <div className="space-y-5">
      {dias.map((dia) => (
        <section key={dia} aria-label={mayuscula(diaLargo(dia))}>
          <h2 className="mb-2 text-sm font-black text-ergon-navy">
            <Link href={p.hrefDia(dia)} className="hover:underline">
              {dia === p.hoy ? "Hoy · " : dia === sumarDias(p.hoy, 1) ? "Mañana · " : ""}
              {mayuscula(diaLargo(dia))}
            </Link>
          </h2>
          <ul className="space-y-2">
            {p.porDia[dia].map((item) => (
              <li key={`${item.tipo}-${item.id}`}>
                <ItemAgendaFila item={item} volver={p.volver} hoy={p.hoy} perfiles={p.perfiles} />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
