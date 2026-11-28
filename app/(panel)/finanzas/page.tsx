import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Download, Receipt, Repeat, Search } from "lucide-react";
import { cn, pesos } from "@/lib/utils";
import { obtenerUsuario } from "@/lib/auth";
import { hoyISO, mayuscula, nombreMes, sumarMeses } from "@/lib/fechas";
import { obtenerMovimientos, obtenerPendientes, obtenerRecurrentes, proyectosParaFinanzas, resumenFinanzas } from "@/lib/finanzas";
import { CATEGORIAS, MES_VALIDO, colorCategoria, nombreCategoria, type EstadoMovimiento, type TipoMovimiento } from "@/lib/finanzas-tipos";
import { Titulo } from "@/components/panel/titulo";
import { Segmentos } from "@/components/ui/segmentos";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { GraficaFlujo } from "@/components/ui/grafica-flujo";
import { Progress } from "@/components/ui/progress";
import { RioDinero } from "@/components/finanzas/rio-dinero";
import { Editores } from "@/components/finanzas/editor";
import { ActividadReciente, BotonesNuevo, ListaMovimientos, ListaRecurrentes, TablaPendientes } from "@/components/finanzas/listas";

export const metadata: Metadata = { title: "Finanzas" };

const VISTAS = ["resumen", "movimientos", "pendientes", "recurrentes", "detalle"] as const;
type Vista = (typeof VISTAS)[number];
const uno = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
const tarjeta = "rounded-[1.1rem] bg-card p-4 shadow-sm md:p-5";
const tituloPanel = "text-sm font-semibold text-ergon-navy";

export default async function FinanzasPage({ searchParams }: PageProps<"/finanzas">) {
  await obtenerUsuario();
  const sp = await searchParams;
  const vista: Vista = (VISTAS as readonly string[]).includes(uno(sp.vista)) ? (uno(sp.vista) as Vista) : "resumen";
  const nuevo = uno(sp.nuevo) === "ingreso" || uno(sp.nuevo) === "gasto" ? (uno(sp.nuevo) as TipoMovimiento) : undefined;
  const proyectos = await proyectosParaFinanzas();

  return (
    <>
      <Titulo accion={<span className="hidden sm:block"><BotonesNuevo recurrente={vista === "recurrentes"} /></span>}>Finanzas</Titulo>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Segmentos
          etiqueta="Secciones de Finanzas"
          activo={vista}
          opciones={[
            { valor: "resumen", etiqueta: "Resumen", href: "/finanzas" },
            { valor: "movimientos", etiqueta: "Movimientos", href: "/finanzas?vista=movimientos" },
            { valor: "pendientes", etiqueta: "Pendientes", href: "/finanzas?vista=pendientes" },
            { valor: "recurrentes", etiqueta: "Fijos", href: "/finanzas?vista=recurrentes" },
            { valor: "detalle", etiqueta: "Detalle", href: "/finanzas?vista=detalle" },
          ]}
        />
        <span className="sm:hidden">
          <BotonesNuevo recurrente={vista === "recurrentes"} />
        </span>
      </div>

      {vista === "resumen" ? <Resumen mes={MES_VALIDO.test(uno(sp.mes)) ? uno(sp.mes) : hoyISO().slice(0, 7)} /> : null}
      {vista === "detalle" ? <Detalle mes={MES_VALIDO.test(uno(sp.mes)) ? uno(sp.mes) : hoyISO().slice(0, 7)} /> : null}
      {vista === "movimientos" ? <Movimientos sp={sp} /> : null}
      {vista === "pendientes" ? <Pendientes /> : null}
      {vista === "recurrentes" ? <Recurrentes /> : null}

      <Editores proyectos={proyectos} nuevo={nuevo} />
    </>
  );
}

/** Flechas para cambiar de mes (Resumen y Detalle). */
function SelectorMes({ mes, vista }: { mes: string; vista: "resumen" | "detalle" }) {
  const actual = hoyISO().slice(0, 7);
  const base = vista === "detalle" ? "/finanzas?vista=detalle&" : "/finanzas?";
  const flecha = "grid size-9 place-items-center rounded-full text-ergon-navy transition-colors hover:bg-ergon-navy/[0.06]";
  return (
    <div className="flex items-center gap-1">
      <Link href={`${base}mes=${sumarMeses(`${mes}-01`, -1).slice(0, 7)}`} className={flecha} aria-label="Mes anterior" scroll={false}>
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <h2 className="min-w-40 text-center text-base font-semibold text-ergon-navy">{mayuscula(nombreMes(`${mes}-15`))}</h2>
      {mes < actual ? (
        <Link href={`${base}mes=${sumarMeses(`${mes}-01`, 1).slice(0, 7)}`} className={flecha} aria-label="Mes siguiente" scroll={false}>
          <ChevronRight className="size-5" aria-hidden />
        </Link>
      ) : (
        <span className="size-9" />
      )}
      {mes !== actual ? (
        <Link href={vista === "detalle" ? "/finanzas?vista=detalle" : "/finanzas"} className="ml-2 text-sm font-bold text-primary hover:underline" scroll={false}>
          Ir a este mes
        </Link>
      ) : null}
    </div>
  );
}

/** Resumen simple: tres números, una gráfica, lo que falta cobrar y los últimos movimientos. */
async function Resumen({ mes }: { mes: string }) {
  const r = await resumenFinanzas(mes);
  const cobrar = r.pendientes.filter((x) => x.tipo === "ingreso").slice(0, 5);
  const numeros = [
    { nombre: "Entró", valor: r.cobrado.actual, clase: "text-ergon-navy" },
    { nombre: "Salió", valor: r.gastado.actual, clase: "text-ergon-navy" },
    { nombre: "Quedó", valor: r.utilidad.actual, clase: r.utilidad.actual < 0 ? "text-error" : "text-exito" },
  ];

  return (
    <div className="space-y-4">
      <SelectorMes mes={mes} vista="resumen" />

      <section className={cn(tarjeta, "grid grid-cols-3 divide-x divide-ergon-navy/[0.08] p-0 md:p-0")} aria-label="Números del mes">
        {numeros.map((n) => (
          <div key={n.nombre} className="min-w-0 px-3 py-4 md:px-6 md:py-5">
            <p className="text-xs text-muted-foreground md:text-sm">{n.nombre}</p>
            <p className={cn("mt-1 truncate text-xl font-semibold tracking-tight tabular-nums sm:text-2xl md:text-[2rem]", n.clase)}>
              {pesos(n.valor).replace(/\.00$/, "")}
            </p>
          </div>
        ))}
      </section>

      <section className={tarjeta} aria-labelledby="flujo-caja">
        <h2 id="flujo-caja" className={cn(tituloPanel, "mb-3")}>Entradas y salidas</h2>
        <GraficaFlujo periodos={r.flujo} inicial="mes" nombreA="Entró" nombreB="Salió" resumen={false} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-labelledby="por-cobrar">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 id="por-cobrar" className={tituloPanel}>
              Por cobrar {r.porCobrar.total ? <span className="font-normal text-muted-foreground">· {pesos(r.porCobrar.total)}</span> : null}
            </h2>
            <Link href="/finanzas?vista=pendientes" className="text-xs text-muted-foreground hover:text-ergon-sky">Ver todo</Link>
          </div>
          <TablaPendientes tipo="ingreso" movimientos={cobrar} compacto />
        </section>
        <section className={tarjeta} aria-labelledby="actividad">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="actividad" className={tituloPanel}>Últimos movimientos</h2>
            <Link href="/finanzas?vista=movimientos" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-ergon-sky">
              Ver todo <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ActividadReciente movimientos={r.recientes} />
        </section>
      </div>
    </div>
  );
}

/** Detalle (para cuando se quiera ver más): a dónde se va el dinero y el flujo completo. */
async function Detalle({ mes }: { mes: string }) {
  const r = await resumenFinanzas(mes);
  const nombre = nombreMes(`${mes}-15`).split(" ")[0];
  const totalGastos = r.gastosPorCategoria.reduce((s2, g) => s2 + g.monto, 0);
  return (
    <div className="space-y-4">
      <SelectorMes mes={mes} vista="detalle" />
      <section className={tarjeta} aria-labelledby="a-donde">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="a-donde" className={tituloPanel}>A dónde se va</h2>
          <span className="text-xs text-muted-foreground">Gastos de {nombre}</span>
        </div>
        {r.gastosPorCategoria.length ? (
          <ul className="grid gap-x-8 gap-y-4 md:grid-cols-2">
            {r.gastosPorCategoria.map((g) => {
              const pct = totalGastos ? (g.monto / totalGastos) * 100 : 0;
              return (
                <li key={g.clave}>
                  <div className="flex items-center gap-2.5">
                    <i className="size-2 shrink-0 rounded-full" style={{ background: colorCategoria(g.clave) }} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ergon-navy">{nombreCategoria(g.clave)}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
                  </div>
                  <Progress value={pct} className="mt-2 h-1.5 bg-ergon-navy/[0.08]" aria-label={nombreCategoria(g.clave)} />
                  <p className="mt-1 text-xs font-semibold tabular-nums text-ergon-navy">{pesos(g.monto)}</p>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState compacto icono={Receipt} titulo="Sin gastos pagados" texto="Cuando registres gastos, aquí verás en qué se va el dinero." />
        )}
      </section>
      <section className={cn(tarjeta, "overflow-hidden")}>
        <RioDinero periodos={r.rio} />
      </section>
    </div>
  );
}

async function Movimientos({ sp }: { sp: Record<string, string | string[] | undefined> }) {
  const tipo = uno(sp.tipo) === "ingreso" || uno(sp.tipo) === "gasto" ? (uno(sp.tipo) as TipoMovimiento) : "";
  const estado = ["pendiente", "pagado", "cancelado"].includes(uno(sp.estado)) ? (uno(sp.estado) as EstadoMovimiento) : "";
  const mes = MES_VALIDO.test(uno(sp.mes)) ? uno(sp.mes) : "";
  const categoria = uno(sp.categoria);
  const q = uno(sp.q).slice(0, 80);
  const movimientos = await obtenerMovimientos({ tipo, estado, mes, categoria, q });

  const enlace = (cambios: Record<string, string>) => {
    const p = new URLSearchParams({ vista: "movimientos" });
    const base = { tipo, estado, mes, categoria, q, ...cambios };
    for (const [k, v] of Object.entries(base)) if (v) p.set(k, v);
    return `/finanzas?${p}`;
  };
  const chip = (texto: string, href: string, activo: boolean) => (
    <Link
      key={href + texto}
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={cn(
        "flex h-9 items-center whitespace-nowrap rounded-full border px-3.5 text-sm font-bold transition-colors",
        activo ? "border-ergon-navy bg-ergon-navy text-white" : "border-white/60 bg-card text-ergon-navy hover:bg-accent",
      )}
    >
      {texto}
    </Link>
  );
  const exportar = new URLSearchParams();
  for (const [k, v] of Object.entries({ tipo, estado, mes, categoria, q })) if (v) exportar.set(k, v);
  const categorias = tipo ? CATEGORIAS[tipo] : [...CATEGORIAS.ingreso, ...CATEGORIAS.gasto];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:px-0">
          {chip("Todos", enlace({ tipo: "", categoria: "" }), !tipo)}
          {chip("Ingresos", enlace({ tipo: "ingreso", categoria: "" }), tipo === "ingreso")}
          {chip("Gastos", enlace({ tipo: "gasto", categoria: "" }), tipo === "gasto")}
          <span className="mx-1 w-px shrink-0 bg-ergon-navy/10" aria-hidden />
          {chip("Pagados", enlace({ estado: estado === "pagado" ? "" : "pagado" }), estado === "pagado")}
          {chip("Pendientes", enlace({ estado: estado === "pendiente" ? "" : "pendiente" }), estado === "pendiente")}
        </div>
      </div>

      <form action="/finanzas" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="vista" value="movimientos" />
        {tipo ? <input type="hidden" name="tipo" value={tipo} /> : null}
        {estado ? <input type="hidden" name="estado" value={estado} /> : null}
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input name="q" type="search" defaultValue={q} placeholder="Buscar concepto, cliente o folio" className="pl-9" aria-label="Buscar movimientos" />
        </div>
        <select
          name="mes"
          defaultValue={mes}
          aria-label="Mes"
          className="h-11 rounded-xl border border-input bg-card px-3 text-base text-ergon-navy outline-none focus-visible:border-ergon-blue md:h-10 md:text-sm"
        >
          <option value="">Todos los meses</option>
          {Array.from({ length: 12 }, (_, i) => sumarMeses(`${hoyISO().slice(0, 7)}-01`, -i).slice(0, 7)).map((x) => (
            <option key={x} value={x}>
              {mayuscula(nombreMes(`${x}-15`))}
            </option>
          ))}
        </select>
        <select
          name="categoria"
          defaultValue={categoria}
          aria-label="Categoría"
          className="h-11 rounded-xl border border-input bg-card px-3 text-base text-ergon-navy outline-none focus-visible:border-ergon-blue md:h-10 md:text-sm"
        >
          <option value="">Todas las categorías</option>
          {categorias.map((c) => (
            <option key={c.clave} value={c.clave}>
              {c.nombre}
            </option>
          ))}
        </select>
        <button type="submit" className="h-10 rounded-full bg-ergon-navy/[0.07] px-4 text-sm font-bold text-ergon-navy hover:bg-ergon-navy/[0.12]">
          Filtrar
        </button>
        <a
          href={`/finanzas/exportar${exportar.size ? `?${exportar}` : ""}`}
          className="ml-auto flex h-10 items-center gap-2 rounded-full border border-input bg-card px-4 text-sm font-bold text-ergon-navy shadow-sm hover:bg-accent"
          download
        >
          <Download className="size-4" aria-hidden /> Excel (CSV)
        </a>
      </form>

      {movimientos.length ? (
        <ListaMovimientos movimientos={movimientos} />
      ) : (
        <EmptyState icono={Receipt} titulo="Sin movimientos" texto={q || mes || tipo || estado || categoria ? "Prueba con otros filtros." : "Registra el primer ingreso o gasto."} accion={<BotonesNuevo />} />
      )}
    </div>
  );
}

async function Pendientes() {
  const pendientes = await obtenerPendientes();
  return (
    <div className="grid gap-6">
      <section aria-labelledby="pend-cobrar">
        <h2 id="pend-cobrar" className="mb-2 px-1 font-black text-ergon-navy">Por cobrar</h2>
        <TablaPendientes tipo="ingreso" movimientos={pendientes.filter((x) => x.tipo === "ingreso")} />
      </section>
      <section aria-labelledby="pend-pagar">
        <h2 id="pend-pagar" className="mb-2 px-1 font-black text-ergon-navy">Por pagar</h2>
        <TablaPendientes tipo="gasto" movimientos={pendientes.filter((x) => x.tipo === "gasto")} />
      </section>
    </div>
  );
}

async function Recurrentes() {
  const recurrentes = await obtenerRecurrentes();
  return recurrentes.length ? (
    <ListaRecurrentes recurrentes={recurrentes} />
  ) : (
    <EmptyState
      icono={Repeat}
      titulo="Sin recurrentes"
      texto="Agrega mensualidades de clientes o gastos fijos (suscripciones, hosting). Cada mes se crea solo el movimiento pendiente."
      accion={<BotonesNuevo recurrente />}
    />
  );
}
