"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { ArrowDownRight, ArrowUpRight, HandCoins, Receipt, TrendingUp, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Aparece, Escalonado } from "@/components/movimiento/escalonado";

const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const reducido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Monto que sube desde 0 al verse (inspirado en Kpi Counter de 21st.dev). */
function Monto({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visto, setVisto] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => e.isIntersecting && setVisto(true));
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || !visto) return;
    if (reducido() || valor === 0) {
      el.textContent = mxn.format(valor);
      return;
    }
    const inicio = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const x = Math.min(1, (t - inicio) / 900);
      el.textContent = mxn.format(valor * (1 - Math.pow(1 - x, 4)));
      if (x < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor, visto]);
  return (
    <span ref={ref} className={className} aria-label={mxn.format(valor)}>
      {mxn.format(valor)}
    </span>
  );
}

/** Mini gráfica de los últimos 6 meses: la línea se dibuja sola. */
function Linea({ serie, color }: { serie: number[]; color: string }) {
  const id = useId().replace(/:/g, "");
  const w = 120;
  const h = 36;
  const max = Math.max(...serie, 1);
  const min = Math.min(...serie, 0);
  const rango = max - min || 1;
  const pts = serie.map((v, i) => [(i / Math.max(1, serie.length - 1)) * w, h - 3 - ((v - min) / rango) * (h - 6)] as const);
  const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
  const ultimo = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="h-9 w-28 overflow-visible" aria-hidden>
      <defs>
        <linearGradient id={`kpi-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.32" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${w} ${h} L0 ${h} Z`} fill={`url(#kpi-${id})`} className="kpi-relleno" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" pathLength={1} className="kpi-trazo" />
      {ultimo ? <circle cx={ultimo[0]} cy={ultimo[1]} r="3" fill={color} className="kpi-punto" /> : null}
    </svg>
  );
}

type Tarjeta = {
  etiqueta: string;
  valor: number;
  anterior?: number;
  serie?: number[];
  /** En gastos, subir es malo. */
  invertido?: boolean;
  contexto?: string;
  alerta?: boolean;
  href: string;
  icono: LucideIcon;
  color: string;
};

function Tendencia({ actual, anterior, invertido }: { actual: number; anterior: number; invertido?: boolean }) {
  if (!anterior && !actual) return <span className="text-xs font-bold text-muted-foreground">Sin movimientos</span>;
  if (!anterior) return <span className="text-xs font-bold text-muted-foreground">Primer mes con datos</span>;
  const cambio = ((actual - anterior) / Math.abs(anterior)) * 100;
  const sube = cambio >= 0;
  const bueno = invertido ? !sube : sube;
  const Icono = sube ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-bold tabular-nums",
        bueno ? "bg-exito/12 text-exito" : "bg-error/12 text-error",
      )}
    >
      <Icono className="size-3.5" aria-hidden />
      {Math.abs(cambio).toFixed(0)}% <span className="sr-only">vs. mes anterior</span>
    </span>
  );
}

export function TarjetasKpi({
  cobrado,
  gastado,
  utilidad,
  porCobrar,
}: {
  cobrado: { actual: number; anterior: number; serie: number[] };
  gastado: { actual: number; anterior: number; serie: number[] };
  utilidad: { actual: number; anterior: number; serie: number[] };
  porCobrar: { total: number; vencido: number; cuantos: number };
}) {
  const tarjetas: Tarjeta[] = [
    { etiqueta: "Cobrado", valor: cobrado.actual, anterior: cobrado.anterior, serie: cobrado.serie, href: "/finanzas?vista=movimientos&tipo=ingreso", icono: Wallet, color: "#2377c2" },
    { etiqueta: "Gastado", valor: gastado.actual, anterior: gastado.anterior, serie: gastado.serie, invertido: true, href: "/finanzas?vista=movimientos&tipo=gasto", icono: Receipt, color: "#f59e0b" },
    { etiqueta: "Utilidad", valor: utilidad.actual, anterior: utilidad.anterior, serie: utilidad.serie, href: "/finanzas?vista=movimientos", icono: TrendingUp, color: "#10b981" },
    {
      etiqueta: "Por cobrar",
      valor: porCobrar.total,
      contexto: porCobrar.vencido ? `${mxn.format(porCobrar.vencido)} vencido` : porCobrar.cuantos ? `${porCobrar.cuantos} pendiente${porCobrar.cuantos === 1 ? "" : "s"}` : "Nada pendiente",
      alerta: porCobrar.vencido > 0,
      href: "/finanzas?vista=pendientes",
      icono: HandCoins,
      color: "#4f6fe8",
    },
  ];
  return (
    <Escalonado className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
      {tarjetas.map((t) => (
        <Aparece key={t.etiqueta}>
          <Link
            href={t.href}
            className="tarjeta-viva group relative flex h-full flex-col overflow-hidden rounded-[1.25rem] border border-white/70 bg-card p-4 shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring md:p-5"
          >
            {/* Brillo de color detrás del vidrio */}
            <span className="pointer-events-none absolute -right-8 -top-10 size-28 rounded-full opacity-25 blur-2xl" style={{ background: t.color }} aria-hidden />
            <span className="relative flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-muted-foreground md:text-sm">{t.etiqueta}</span>
              <span
                className="flex size-8 shrink-0 items-center justify-center rounded-xl text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.35)] transition-transform group-hover:-rotate-6 group-hover:scale-110"
                style={{ background: t.color }}
              >
                <t.icono className="size-4" aria-hidden />
              </span>
            </span>
            <Monto
              valor={t.valor}
              className={cn(
                "relative mt-2 block truncate text-2xl font-black tabular-nums tracking-tight md:text-[1.75rem]",
                t.valor === 0 ? "text-ergon-navy/35" : t.valor < 0 ? "text-error" : "text-ergon-navy",
              )}
            />
            <span className="relative mt-auto flex items-end justify-between gap-2 pt-2">
              {t.serie ? (
                <>
                  <Tendencia actual={t.valor} anterior={t.anterior ?? 0} invertido={t.invertido} />
                  <span className="hidden sm:block">
                    <Linea serie={t.serie} color={t.color} />
                  </span>
                </>
              ) : (
                <span className={cn("text-xs font-bold", t.alerta ? "text-error" : "text-muted-foreground")}>{t.contexto}</span>
              )}
            </span>
          </Link>
        </Aparece>
      ))}
    </Escalonado>
  );
}
