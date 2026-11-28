import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, Download, HandCoins, Receipt, Repeat, Search, TrendingUp } from "lucide-react";
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

const VISTAS = ["resumen", "movimientos", "pendientes", "recurrentes"] as const;
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
            { valor: "recurrentes", etiqueta: "Recurrentes", href: "/finanzas?vista=recurrentes" },
          ]}
        />
        <span className="sm:hidden">
          <BotonesNuevo recurrente={vista === "recurrentes"} />
        </span>
      </div>

      {vista === "resumen" ? <Resumen mes={MES_VALIDO.test(uno(sp.mes)) ? uno(sp.mes) : hoyISO().slice(0, 7)} /> : null}
      {vista === "movimientos" ? <Movimientos sp={sp} /> : null}
      {vista === "pendientes" ? <Pendientes /> : null}
      {vista === "recurrentes" ? <Recurrentes /> : null}

      <Editores proyectos={proyectos} nuevo={nuevo} />
    </>
  );
}

async function Resumen({ mes }: { mes: string }) {
  const r = await resumenFinanzas(mes);
  const actual = hoyISO().slice(0, 7);
  const anterior = sumarMeses(`${mes}-01`, -1).slice(0, 7);
  const siguiente = sumarMeses(`${mes}-01`, 1).slice(0, 7);
  const cobrar = r.pendientes.filter((x) => x.tipo === "ingreso").slice(0, 6);
  const pagar = r.pendientes.filter((x) => x.tipo === "gasto").slice(0, 6);
  const flecha = "grid size-9 place-items-center rounded-full text-ergon-navy transition-colors hover:bg-ergon-navy/[0.06]";
  const nombre = nombreMes(`${mes}-15`).split(" ")[0];
  const cambio = r.utilidad.anterior ? ((r.utilidad.actual - r.utilidad.anterior) / Math.abs(r.utilidad.anterior)) * 100 : null;
  const totalGastos = r.gastosPorCategoria.reduce((s2, g) => s2 + g.monto, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1">
        <Link href={`/finanzas?mes=${anterior}`} className={flecha} aria-label="Mes anterior" scroll={false}>
          <ChevronLeft className="size-5" aria-hidden />
        </Link>
        <h2 className="min-w-40 text-center text-base font-semibold text-ergon-navy">{mayuscula(nombreMes(`${mes}-15`))}</h2>
        {mes < actual ? (
          <Link href={`/finanzas?mes=${siguiente}`} className={flecha} aria-label="Mes siguiente" scroll={false}>
            <ChevronRight className="size-5" aria-hidden />
          </Link>
        ) : (
          <span className="size-9" />
        )}
        {mes !== actual ? (
          <Link href="/finanzas" className="ml-2 text-sm font-bold text-primary hover:underline" scroll={false}>
            Ir a este mes
          </Link>
        ) : null}
      </div>

      {/* Fila 1: utilidad del mes + flujo de efectivo */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[0.82fr_1.5fr]">
        <section className={cn(tarjeta, "flex flex-col")}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Utilidad de {nombre}</span>
            <TrendingUp className="size-4 opacity-70" aria-hidden />
          </div>
          <strong
            className={cn(
              "mt-3 block truncate text-[2.4rem] font-medium leading-tight tracking-[-0.04em] tabular-nums md:text-[2.7rem]",
              r.utilidad.actual < 0 ? "text-error" : "text-ergon-navy",
            )}
          >
            {pesos(r.utilidad.actual)}
          </strong>
          <p className="mt-2 text-xs text-muted-foreground">
            {cambio === null ? (
              "Primer mes con datos"
            ) : (
              <>
                <span className={cn("mr-1.5 rounded-md px-1.5 py-0.5 font-semibold tabular-nums", cambio >= 0 ? "bg-ergon-sky/15 text-ergon-sky" : "bg-error/12 text-error")}>
                  {cambio > 0 ? "+" : ""}
                  {cambio.toFixed(1)}%
                </span>
                comparado con el mes pasado
              </>
            )}
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-3 text-xs">
            <div>
              <dt className="text-muted-foreground">Cobrado</dt>
              <dd className="mt-0.5 text-base font-semibold tabular-nums text-ergon-navy">{pesos(r.cobrado.actual)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Gastado</dt>
              <dd className="mt-0.5 text-base font-semibold tabular-nums text-ergon-navy">{pesos(r.gastado.actual)}</dd>
            </div>
          </dl>
          <Link href="/finanzas?vista=pendientes" className="group mt-auto flex items-center gap-3 pt-6">
            <span className="grid size-9 shrink-0 place-items-center rounded-[0.7rem] bg-ergon-navy/[0.07] text-ergon-navy">
              <HandCoins className="size-[1.1rem]" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold text-ergon-navy">Por cobrar · {pesos(r.porCobrar.total)}</span>
              <span className={cn("block text-[11px]", r.porCobrar.vencido ? "font-semibold text-error" : "text-muted-foreground")}>
                {r.porCobrar.vencido
                  ? `${pesos(r.porCobrar.vencido)} vencido`
                  : r.porCobrar.cuantos
                    ? `${r.porCobrar.cuantos} pendiente${r.porCobrar.cuantos === 1 ? "" : "s"}`
                    : "Nada pendiente"}
              </span>
            </span>
            <span className="grid size-9 place-items-center rounded-full bg-ergon-navy/[0.07] text-ergon-navy transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
              <ArrowUpRight className="size-[1.1rem]" aria-hidden />
            </span>
          </Link>
        </section>

        <section className={tarjeta} aria-labelledby="flujo-caja">
          <h2 id="flujo-caja" className={cn(tituloPanel, "mb-3")}>Flujo de efectivo</h2>
          <GraficaFlujo periodos={r.flujo} inicial="mes" nombreA="Entró" nombreB="Salió" />
        </section>
      </div>

      {/* Fila 2: actividad reciente + a dónde se va */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.3fr_1fr]">
        <section className={tarjeta} aria-labelledby="actividad">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="actividad" className={tituloPanel}>Actividad reciente</h2>
            <Link href="/finanzas?vista=movimientos" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-ergon-sky">
              Ver todo <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ActividadReciente movimientos={r.recientes} />
        </section>

        <section className={tarjeta} aria-labelledby="a-donde">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="a-donde" className={tituloPanel}>A dónde se va</h2>
            <span className="text-xs text-muted-foreground">Gastos de {nombre}</span>
          </div>
          {r.gastosPorCategoria.length ? (
            <ul className="space-y-4">
              {r.gastosPorCategoria.slice(0, 4).map((g) => {
                const pct = totalGastos ? (g.monto / totalGastos) * 100 : 0;
                return (
                  <li key={g.clave}>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 shrink-0 place-items-center rounded-[0.6rem] bg-ergon-navy/[0.06]">
                        <i className="size-2 rounded-full" style={{ background: colorCategoria(g.clave) }} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ergon-navy">{nombreCategoria(g.clave)}</span>
                      <span className="text-xs tabular-nums text-muted-foreground">{Math.round(pct)}%</span>
                    </div>
                    <Progress value={pct} className="mt-2.5 h-1.5 bg-ergon-navy/[0.08]" aria-label={nombreCategoria(g.clave)} />
                    <p className="mt-1.5 flex justify-between text-xs text-muted-foreground">
                      <strong className="font-semibold tabular-nums text-ergon-navy">{pesos(g.monto)}</strong>
                      <span className="tabular-nums">de {pesos(totalGastos)}</span>
                    </p>
                  </li>
                );
              })}
              {r.gastosPorCategoria.length > 4 ? (
                <li className="text-xs text-muted-foreground">
                  y {r.gastosPorCategoria.length - 4} categoría{r.gastosPorCategoria.length - 4 === 1 ? "" : "s"} más ·{" "}
                  <Link href="/finanzas?vista=movimientos&tipo=gasto" className="font-semibold text-ergon-sky hover:underline">ver gastos</Link>
                </li>
              ) : null}
            </ul>
          ) : (
            <EmptyState compacto icono={Receipt} titulo="Sin gastos pagados" texto="Cuando registres gastos, aquí verás en qué se va el dinero." />
          )}
        </section>
      </div>

      <section className={cn(tarjeta, "overflow-hidden")}>
        <RioDinero periodos={r.rio} />
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <section aria-labelledby="por-cobrar">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 id="por-cobrar" className={tituloPanel}>Por cobrar</h2>
            <Link href="/finanzas?vista=pendientes" className="text-xs text-muted-foreground hover:text-ergon-sky">Ver todo</Link>
          </div>
          <TablaPendientes tipo="ingreso" movimientos={cobrar} compacto />
        </section>
        <section aria-labelledby="por-pagar">
          <div className="mb-2 flex items-baseline justify-between px-1">
            <h2 id="por-pagar" className={tituloPanel}>Por pagar</h2>
            <Link href="/finanzas?vista=pendientes" className="text-xs text-muted-foreground hover:text-ergon-sky">Ver todo</Link>
          </div>
          <TablaPendientes tipo="gasto" movimientos={pagar} compacto />
        </section>
      </div>
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
