import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { userAgent } from "next/server";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerCatalogos } from "@/lib/tareas";
import { obtenerAgenda } from "@/lib/agenda";
import { NOMBRE_VISTA, VISTAS_AGENDA, type VistaAgenda } from "@/lib/agenda-tipos";
import {
  FECHA_VALIDA,
  diaLargo,
  fechaCorta,
  hoyISO,
  inicioMes,
  inicioSemana,
  mayuscula,
  nombreMes,
  sumarDias,
  sumarMeses,
} from "@/lib/fechas";
import { Button } from "@/components/ui/button";
import { VistaDia, VistaLista, VistaMes, VistaSemana } from "@/components/agenda/vistas";

export const metadata: Metadata = { title: "Agenda" };

const DIAS_LISTA = 30;

function rango(vista: VistaAgenda, fecha: string) {
  switch (vista) {
    case "dia":
      return { desde: fecha, hasta: fecha, anterior: sumarDias(fecha, -1), siguiente: sumarDias(fecha, 1) };
    case "semana": {
      const desde = inicioSemana(fecha);
      return { desde, hasta: sumarDias(desde, 6), anterior: sumarDias(fecha, -7), siguiente: sumarDias(fecha, 7) };
    }
    case "mes": {
      const primero = inicioMes(fecha);
      const ultimo = sumarDias(sumarMeses(primero, 1), -1);
      return {
        desde: inicioSemana(primero),
        hasta: sumarDias(inicioSemana(ultimo), 6),
        anterior: sumarMeses(primero, -1),
        siguiente: sumarMeses(primero, 1),
      };
    }
    case "lista":
      return {
        desde: fecha,
        hasta: sumarDias(fecha, DIAS_LISTA - 1),
        anterior: sumarDias(fecha, -DIAS_LISTA),
        siguiente: sumarDias(fecha, DIAS_LISTA),
      };
  }
}

function titulo(vista: VistaAgenda, fecha: string, desde: string, hasta: string, hoy: string) {
  if (vista === "dia") return mayuscula(diaLargo(fecha));
  if (vista === "mes") return mayuscula(nombreMes(fecha));
  if (vista === "semana") return `${fechaCorta(desde, hoy)} – ${fechaCorta(hasta, hoy)}`;
  return `${fechaCorta(desde, hoy)} – ${fechaCorta(hasta, hoy)}`;
}

export default async function AgendaPage({ searchParams }: PageProps<"/agenda">) {
  const usuario = await obtenerUsuario();
  const sp = await searchParams;
  const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

  // En celular se abre en "Día"; en computadora, en "Semana".
  const esCelular = userAgent({ headers: await headers() }).device.type === "mobile";
  const vistaParam = uno(sp.vista);
  const vista: VistaAgenda = (VISTAS_AGENDA as readonly string[]).includes(vistaParam)
    ? (vistaParam as VistaAgenda)
    : esCelular
      ? "dia"
      : "semana";
  const hoy = hoyISO();
  const fecha = FECHA_VALIDA.test(uno(sp.fecha)) ? uno(sp.fecha) : hoy;
  const de = uno(sp.de) || "todos";

  const { desde, hasta, anterior, siguiente } = rango(vista, fecha);
  const [catalogos, porDia] = await Promise.all([
    obtenerCatalogos(usuario.id),
    obtenerAgenda({ desde, hasta, de, yoId: usuario.id }),
  ]);

  const href = (cambios: Record<string, string | null>) => {
    const p = new URLSearchParams({ vista, fecha, ...(de !== "todos" ? { de } : {}) });
    for (const [k, v] of Object.entries(cambios)) {
      if (v === null) p.delete(k);
      else p.set(k, v);
    }
    if (p.get("fecha") === hoy) p.delete("fecha");
    return `/agenda?${p}`;
  };
  const volver = href({});
  const hrefDia = (f: string) => href({ vista: "dia", fecha: f });

  // Celular: Día y Lista primero.
  const pestanas: VistaAgenda[] = esCelular ? ["dia", "lista", "semana", "mes"] : ["dia", "semana", "mes", "lista"];
  const otros = catalogos.perfiles.filter((p) => p.usuario_id !== usuario.id);
  const filtros = [
    { valor: "todos", nombre: "Ambos" },
    { valor: "mias", nombre: "Mía" },
    ...otros.map((p) => ({ valor: p.usuario_id, nombre: `De ${p.nombre.split(" ")[0]}` })),
  ];

  const comun = { porDia, volver, hoy, perfiles: catalogos.perfiles, hrefDia };

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-ergon-navy">Agenda</h1>
        <Button asChild>
          <Link href={`/agenda/eventos/nuevo?fecha=${vista === "dia" ? fecha : hoy}&volver=${encodeURIComponent(volver)}`}>
            <Plus /> Evento
          </Link>
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div role="tablist" className="inline-flex rounded-lg bg-secondary p-1">
          {pestanas.map((v) => (
            <Link
              key={v}
              role="tab"
              aria-selected={vista === v}
              href={href({ vista: v })}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-bold sm:px-4",
                vista === v ? "bg-card text-ergon-navy shadow-sm" : "text-muted-foreground hover:text-ergon-navy",
              )}
            >
              {NOMBRE_VISTA[v]}
            </Link>
          ))}
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:ml-auto sm:px-0">
          {filtros.map((f) => (
            <Link
              key={f.valor}
              href={href({ de: f.valor === "todos" ? null : f.valor })}
              aria-current={de === f.valor ? "true" : undefined}
              className={cn(
                "flex h-9 items-center whitespace-nowrap rounded-full border px-3 text-sm font-bold",
                de === f.valor ? "border-ergon-navy bg-ergon-navy text-white" : "bg-card text-ergon-navy hover:bg-accent",
              )}
            >
              {f.nombre}
            </Link>
          ))}
        </div>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Button asChild variant="outline" size="icon" aria-label="Anterior">
          <Link href={href({ fecha: anterior })}>
            <ChevronLeft />
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" aria-label="Siguiente">
          <Link href={href({ fecha: siguiente })}>
            <ChevronRight />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href={href({ fecha: null })}>Hoy</Link>
        </Button>
        <h2 className="ml-1 text-lg font-black text-ergon-navy">{titulo(vista, fecha, desde, hasta, hoy)}</h2>
      </div>

      <div className="mb-3 flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border-l-4 border-ergon-blue bg-blue-50" aria-hidden /> Evento
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded-sm border border-dashed border-muted-foreground" aria-hidden /> Tarea
        </span>
      </div>

      {vista === "dia" ? <VistaDia fecha={fecha} {...comun} /> : null}
      {vista === "semana" ? <VistaSemana desde={desde} {...comun} /> : null}
      {vista === "mes" ? <VistaMes desde={desde} hasta={hasta} mes={fecha.slice(0, 7)} {...comun} /> : null}
      {vista === "lista" ? <VistaLista desde={desde} hasta={hasta} {...comun} /> : null}
    </>
  );
}
