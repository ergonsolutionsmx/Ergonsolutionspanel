/*
 * Adaptado de "Money River" (codeandchill, 21st.dev). Cambios: datos de Finanzas,
 * colores Ergon, pesos MXN, español y vidrio.
 */
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { cn } from "@/lib/utils";
import { colorCategoria, nombreCategoria } from "@/lib/finanzas-tipos";
import type { RioPeriodo } from "@/lib/finanzas";
import { Segmentos } from "@/components/ui/segmentos";

type Fuente = { id: string; label: string; value: number; color: string };
type Bolsa = { id: string; label: string; color: string };
type Destino = { id: string; label: string; bucket: string; value: number };
type FlowNode = { id: string; label: string; value: number; col: 0 | 1 | 2; color: string };
type FlowLink = { from: string; to: string; value: number; color: string };
type Geo = {
  total: number;
  nodes: Record<string, { y: number; h: number; v: number }>;
  links: { sy: number; ty: number; w: number; v: number }[];
};

/** Columna del medio: a qué "bolsa" va cada categoría de gasto. Lo que sobra es utilidad. */
const BOLSAS: Bolsa[] = [
  { id: "operacion", label: "Operación", color: "#4f6fe8" },
  { id: "crecimiento", label: "Crecimiento", color: "#f59e0b" },
  { id: "impuestos", label: "Impuestos", color: "#f472b6" },
  { id: "otros", label: "Otros", color: "#64748b" },
  { id: "utilidad", label: "Utilidad", color: "#10b981" },
];
const BOLSA_DE: Record<string, string> = {
  herramientas: "operacion",
  hosting: "operacion",
  equipo: "operacion",
  comisiones: "operacion",
  publicidad: "crecimiento",
  impuestos: "impuestos",
  otro_gasto: "otros",
};
const NOMBRE_PERIODO = { mes: "Mes", trimestre: "Trimestre", anio: "Año" } as const;

function build(p: RioPeriodo) {
  const fuentes: Fuente[] = p.fuentes.map((f) => ({ id: f.clave, label: nombreCategoria(f.clave), value: f.valor, color: colorCategoria(f.clave) }));
  const destinos: Destino[] = p.gastos.map((g) => ({ id: g.clave, label: nombreCategoria(g.clave), bucket: BOLSA_DE[g.clave] ?? "otros", value: g.valor }));
  const income = fuentes.reduce((s, x) => s + x.value, 0);
  const spend = destinos.reduce((s, x) => s + x.value, 0);
  const total = Math.max(income, spend);
  const sources = [...fuentes, { id: "__saldo", label: "De ahorros", value: Math.max(0, spend - income), color: "#94a3b8" }];
  const categories = [...destinos, { id: "__queda", label: "Lo que queda", bucket: "utilidad", value: Math.max(0, income - spend) }];
  const bucketVal: Record<string, number> = {};
  BOLSAS.forEach((b) => (bucketVal[b.id] = 0));
  categories.forEach((c) => (bucketVal[c.bucket] = (bucketVal[c.bucket] ?? 0) + c.value));
  const colorOf = (b: string) => BOLSAS.find((x) => x.id === b)?.color ?? "#64748b";
  const nodes: FlowNode[] = [
    ...sources.map((s) => ({ id: s.id, label: s.label, value: s.value, col: 0 as const, color: s.color })),
    ...BOLSAS.map((b) => ({ id: b.id, label: b.label, value: bucketVal[b.id] ?? 0, col: 1 as const, color: b.color })),
    ...categories.map((c) => ({ id: c.id, label: c.label, value: c.value, col: 2 as const, color: colorOf(c.bucket) })),
  ];
  const links: FlowLink[] = [];
  sources.forEach((s) => BOLSAS.forEach((b) => links.push({ from: s.id, to: b.id, value: total ? (s.value * (bucketVal[b.id] ?? 0)) / total : 0, color: s.color })));
  categories.forEach((c) => links.push({ from: c.bucket, to: c.id, value: c.value, color: colorOf(c.bucket) }));
  return { nodes, links, total, income, spend };
}

const GAP = 8;
function layout(nodes: FlowNode[], links: FlowLink[], H: number): Geo {
  const cols = [0, 1, 2].map((c) => nodes.filter((n) => n.col === c));
  const total = Math.max(1, ...cols.map((c) => c.reduce((s, n) => s + n.value, 0)));
  const maxCount = Math.max(...cols.map((c) => c.filter((n) => n.value > 0.5).length));
  const k = (H - GAP * Math.max(0, maxCount - 1)) / total;
  const g: Geo = { nodes: {}, links: [], total };
  cols.forEach((col) => {
    const live = col.filter((n) => n.value > 0.5);
    let y = (H - (live.reduce((s, n) => s + n.value * k, 0) + GAP * Math.max(0, live.length - 1))) / 2;
    col.forEach((n) => {
      const h = n.value > 0.5 ? n.value * k : 0;
      g.nodes[n.id] = { y, h, v: n.value };
      y += h + (h ? GAP : 0);
    });
  });
  const idx = (id: string) => nodes.findIndex((n) => n.id === id);
  const order = links.map((l, i) => ({ l, i }));
  const outOff: Record<string, number> = {};
  const inOff: Record<string, number> = {};
  const sy: number[] = [];
  const ty: number[] = [];
  [...order].sort((a, b) => idx(a.l.from) - idx(b.l.from) || idx(a.l.to) - idx(b.l.to)).forEach(({ l, i }) => {
    const o = outOff[l.from] ?? 0;
    sy[i] = (g.nodes[l.from]?.y ?? 0) + o;
    outOff[l.from] = o + l.value * k;
  });
  [...order].sort((a, b) => idx(a.l.to) - idx(b.l.to) || idx(a.l.from) - idx(b.l.from)).forEach(({ l, i }) => {
    const o = inOff[l.to] ?? 0;
    ty[i] = (g.nodes[l.to]?.y ?? 0) + o;
    inOff[l.to] = o + l.value * k;
  });
  g.links = links.map((l, i) => ({ sy: sy[i] ?? 0, ty: ty[i] ?? 0, w: l.value * k, v: l.value }));
  return g;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Geo, b: Geo, t: number): Geo => ({
  total: lerp(a.total, b.total, t),
  nodes: Object.fromEntries(
    Object.entries(b.nodes).map(([id, n]) => {
      const o = a.nodes[id] ?? n;
      return [id, { y: lerp(o.y, n.y, t), h: lerp(o.h, n.h, t), v: lerp(o.v, n.v, t) }];
    }),
  ),
  links: b.links.map((l, i) => {
    const o = a.links[i] ?? l;
    return { sy: lerp(o.sy, l.sy, t), ty: lerp(o.ty, l.ty, t), w: lerp(o.w, l.w, t), v: lerp(o.v, l.v, t) };
  }),
});
const expoInOut = (t: number) => (t <= 0 ? 0 : t >= 1 ? 1 : t < 0.5 ? Math.pow(2, 20 * t - 10) / 2 : (2 - Math.pow(2, -20 * t + 10)) / 2);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** Separa etiquetas apiladas para que no se encimen. */
function relax(items: { id: string; c: number; h: number }[], max: number) {
  const list = [...items].sort((a, b) => a.c - b.c);
  const tops = list.map((p) => p.c - p.h / 2);
  for (let i = 1; i < list.length; i++) tops[i] = Math.max(tops[i]!, tops[i - 1]! + list[i - 1]!.h + 2);
  for (let i = list.length - 1; i >= 0; i--) {
    const lim = i === list.length - 1 ? max - list[i]!.h : tops[i + 1]! - list[i]!.h - 2;
    tops[i] = Math.max(0, Math.min(tops[i]!, lim));
  }
  return Object.fromEntries(list.map((p, i) => [p.id, tops[i]!]));
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    on();
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });
const fmt = (v: number) => money.format(Math.round(v) + 0);
const pct = (v: number) => `${Math.round(v * 100)}%`;

/** De dónde vino el dinero, a qué se fue y cuánto quedó. Se transforma al cambiar de periodo. */
export function RioDinero({ periodos, height = 340 }: { periodos: RioPeriodo[]; height?: number }) {
  const [periodId, setPeriodId] = useState<RioPeriodo["id"]>(periodos[0]?.id ?? "mes");
  const period = periodos.find((p) => p.id === periodId) ?? periodos[0]!;
  const data = useMemo(() => build(period), [period]);
  const { nodes, links } = data;
  const reduced = useReducedMotion();
  const vacio = data.income + data.spend < 1;

  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [geo, setGeo] = useState<Geo | null>(null);
  const geoRef = useRef<Geo | null>(null);
  const [pour, setPour] = useState(0);
  const [hover, setHover] = useState<{ kind: "node" | "link"; id: string | number } | null>(null);
  const [pinned, setPinned] = useState<string | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; title: string; sub: string } | null>(null);
  const clipId = `rio-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;

  const padT = 6;
  const H = height - padT * 2;
  const narrow = w > 0 && w < 560;
  const L = narrow ? 72 : 160;
  const R = narrow ? 150 : 250;
  const NW = 10;
  const inner = Math.max(150, w - L - R);
  const xs = [L, L + inner / 2 - NW / 2, L + inner - NW];

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      if (e) setW(Math.round(e.contentRect.width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Periodo nuevo: cada listón se transforma desde donde está.
  useEffect(() => {
    const next = layout(nodes, links, H);
    const prev = geoRef.current;
    let raf = 0;
    if (!prev || reduced) {
      geoRef.current = next;
      raf = requestAnimationFrame(() => setGeo(next));
      return () => cancelAnimationFrame(raf);
    }
    const t0 = performance.now();
    const step = (now: number) => {
      const t = Math.min(1, (now - t0) / 700);
      const g = t >= 1 ? next : mix(prev, next, expoInOut(t));
      geoRef.current = g;
      setGeo(g);
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [nodes, links, H, reduced]);

  // Entrada: los listones "se vierten" de izquierda a derecha.
  useEffect(() => {
    let raf = 0;
    if (reduced) {
      raf = requestAnimationFrame(() => setPour(1));
      return () => cancelAnimationFrame(raf);
    }
    const t0 = performance.now() + 150;
    const step = (now: number) => {
      const t = Math.max(0, Math.min(1, (now - t0) / 1100));
      setPour(easeInOut(t));
      if (t < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const active = hover ?? (pinned ? { kind: "node" as const, id: pinned } : null);
  const lit = useMemo(() => {
    if (!active) return null;
    const ln = new Set<number>();
    const nd = new Set<string>();
    const colOf = (id: string) => nodes.find((x) => x.id === id)?.col;
    if (active.kind === "link") {
      const l = links[active.id as number];
      if (l) {
        ln.add(active.id as number);
        nd.add(l.from);
        nd.add(l.to);
      }
    } else {
      const id = active.id as string;
      nd.add(id);
      links.forEach((l, i) => {
        if (l.from === id || l.to === id) {
          ln.add(i);
          nd.add(l.from);
          nd.add(l.to);
        }
      });
      const col = colOf(id);
      if (col === 2) {
        const b = links.find((l) => l.to === id)?.from;
        links.forEach((l, i) => {
          if (l.to === b && l.value > 0.5) {
            ln.add(i);
            nd.add(l.from);
          }
        });
      }
      if (col === 0) {
        links.forEach((l, i) => {
          if (colOf(l.from) === 1 && links.some((m) => m.from === id && m.to === l.from && m.value > 0.5)) {
            ln.add(i);
            nd.add(l.to);
          }
        });
      }
    }
    return { ln, nd };
  }, [active, links, nodes]);

  const showTip = (e: ReactPointerEvent, t: string, sub: string) => {
    const r = box.current?.getBoundingClientRect();
    if (r) setTip({ x: e.clientX - r.left, y: e.clientY - r.top, title: t, sub });
  };
  const name = (id: string) => nodes.find((n) => n.id === id)?.label ?? id;
  const pick = (n: FlowNode) => setPinned((p) => (p === n.id ? null : n.id));

  const labelTop = useMemo(() => {
    if (!geo) return {} as Record<string, number>;
    const side = (col: 0 | 2, h: number) =>
      relax(
        nodes
          .filter((n) => n.col === col && (geo.nodes[n.id]?.v ?? 0) > 0.5)
          .map((n) => {
            const q = geo.nodes[n.id]!;
            return { id: n.id, c: padT + q.y + q.h / 2, h };
          }),
        height,
      );
    return { ...side(0, narrow ? 30 : 36), ...side(2, 18) };
  }, [geo, nodes, height, narrow]);

  const ribbon = (i: number, l: FlowLink) => {
    const q = geo?.links[i];
    const a = nodes.find((n) => n.id === l.from);
    const b = nodes.find((n) => n.id === l.to);
    if (!q || !a || !b || q.w < 0.2) return "";
    const x1 = xs[a.col]! + NW;
    const x2 = xs[b.col]!;
    const mx = (x1 + x2) / 2;
    const y1 = padT + q.sy;
    const y2 = padT + q.ty;
    const ww = q.w;
    return `M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2} L${x2},${y2 + ww} C${mx},${y2 + ww} ${mx},${y1 + ww} ${x1},${y1 + ww} Z`;
  };

  const kept = data.income - data.spend;

  return (
    <div className="w-full">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-black text-ergon-navy">Flujo del dinero</h2>
          <p className="text-sm text-muted-foreground">De dónde vino, a dónde se fue y cuánto quedó</p>
        </div>
        <Segmentos
          etiqueta="Periodo"
          tamano="sm"
          activo={period.id}
          onCambio={(v) => {
            setPeriodId(v as RioPeriodo["id"]);
            setPinned(null);
          }}
          opciones={periodos.map((p) => ({ valor: p.id, etiqueta: NOMBRE_PERIODO[p.id] }))}
        />
      </header>

      <dl className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        {[
          { k: "Entró", v: fmt(data.income), c: "text-ergon-navy" },
          { k: "Salió", v: fmt(data.spend), c: "text-ergon-navy" },
          { k: kept >= 0 ? "Quedó" : "Faltó", v: fmt(Math.abs(kept)), c: kept >= 0 ? "text-exito" : "text-error" },
        ].map((s) => (
          <div key={s.k} className="rounded-2xl bg-ergon-navy/[0.04] px-3 py-2.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.4)]">
            <dt className="text-xs font-bold text-muted-foreground">{s.k}</dt>
            <dd className={cn("truncate text-base font-black tracking-tight tabular-nums sm:text-xl", s.c)}>{s.v}</dd>
          </div>
        ))}
      </dl>

      {vacio ? (
        <p className="grid h-40 place-items-center rounded-2xl border border-dashed border-ergon-navy/15 text-sm text-muted-foreground">
          Aún no hay ingresos ni gastos pagados en este periodo.
        </p>
      ) : (
        <div
          ref={box}
          className="relative w-full select-none"
          style={{ height }}
          onPointerLeave={() => {
            setHover(null);
            setTip(null);
          }}
        >
          <svg
            width={w}
            height={height}
            viewBox={`0 0 ${w || 1} ${height}`}
            className="block overflow-visible"
            role="img"
            aria-label={`Flujo del dinero (${NOMBRE_PERIODO[period.id]}): entró ${fmt(data.income)}, salió ${fmt(data.spend)}`}
          >
            <defs>
              <clipPath id={clipId}>
                <rect x="0" y="0" width={w * pour} height={height} />
              </clipPath>
            </defs>
            <g clipPath={`url(#${clipId})`}>
              {links.map((l, i) => (
                <path
                  key={i}
                  d={ribbon(i, l)}
                  fill={l.color}
                  className="cursor-pointer transition-opacity duration-200"
                  style={{ opacity: lit ? (lit.ln.has(i) ? 0.62 : 0.07) : 0.3 }}
                  onPointerEnter={() => setHover({ kind: "link", id: i })}
                  onPointerMove={(e) => {
                    const v = geo?.links[i]?.v ?? l.value;
                    showTip(e, `${name(l.from)} → ${name(l.to)}`, `${fmt(v)} · ${pct(v / (geo?.total || 1))} del total`);
                  }}
                />
              ))}
            </g>
            {nodes.map((n, i) => {
              const q = geo?.nodes[n.id];
              return (
                <rect
                  key={n.id}
                  className="rio-nodo cursor-pointer transition-opacity duration-200"
                  x={xs[n.col]}
                  y={padT + (q?.y ?? 0)}
                  width={NW}
                  height={Math.max(0, q?.h ?? 0)}
                  rx={NW / 2}
                  fill={n.color}
                  style={{ opacity: lit && !lit.nd.has(n.id) ? 0.3 : 1, animationDelay: `${i * 20}ms` }}
                  onPointerEnter={() => setHover({ kind: "node", id: n.id })}
                  onPointerMove={(e) => showTip(e, n.label, fmt(q?.v ?? n.value))}
                  onClick={() => pick(n)}
                />
              );
            })}
          </svg>

          {geo &&
            nodes.map((n, i) => {
              const q = geo.nodes[n.id];
              if (!q) return null;
              const on = q.v > 0.5;
              const isLit = !lit || lit.nd.has(n.id);
              const value = n.col === 1 ? pct(q.v / (geo.total || 1)) : fmt(q.v);
              const top = n.col === 1 ? padT + q.y + q.h / 2 - 13 : (labelTop[n.id] ?? 0);
              const left = n.col === 0 ? 0 : n.col === 1 ? xs[1]! + NW / 2 : xs[2]! + NW + 8;
              return (
                <button
                  key={n.id}
                  type="button"
                  aria-label={`${n.label}: ${fmt(n.value)}`}
                  aria-pressed={pinned === n.id}
                  onPointerEnter={() => {
                    setHover({ kind: "node", id: n.id });
                    setTip(null);
                  }}
                  onFocus={() => setHover({ kind: "node", id: n.id })}
                  onBlur={() => setHover(null)}
                  onClick={() => pick(n)}
                  className={cn(
                    "rio-etiqueta absolute left-0 top-0 rounded-md text-left font-bold transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    n.col === 1
                      ? "vidrio-solido flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-full pl-[7px] pr-[9px] text-xs text-ergon-navy"
                      : n.col === 0
                        ? "flex flex-col items-end text-right leading-tight"
                        : "flex items-baseline gap-1.5 whitespace-nowrap text-xs sm:text-[13px]",
                    isLit ? "" : "text-muted-foreground",
                  )}
                  style={{
                    visibility: on ? "visible" : "hidden",
                    transform: n.col === 1 ? `translate(${left}px, ${top}px) translateX(-50%)` : `translate(${left}px, ${top}px)`,
                    width: n.col === 0 ? L - 14 : undefined,
                    animationDelay: `${500 + i * 25}ms`,
                  }}
                >
                  {n.col === 1 ? (
                    <>
                      <i className="size-2 rounded-full" style={{ background: n.color }} aria-hidden />
                      {n.label}
                      <b className="font-bold tabular-nums text-muted-foreground">{value}</b>
                    </>
                  ) : n.col === 0 ? (
                    <>
                      <span className="max-w-full truncate text-[11px] text-muted-foreground sm:text-xs">{n.label}</span>
                      <b className={cn("text-sm font-black tracking-tight tabular-nums sm:text-[15px]", isLit ? "text-ergon-navy" : "text-muted-foreground")}>{value}</b>
                    </>
                  ) : (
                    <>
                      <span className={cn("max-w-[3.75rem] truncate sm:max-w-[10.5rem]", isLit ? "text-ergon-navy/85" : "")}>{n.label}</span>
                      <b className={cn("font-black tabular-nums", isLit ? "text-ergon-navy" : "text-muted-foreground")}>{value}</b>
                    </>
                  )}
                </button>
              );
            })}

          {tip && (
            <span
              role="presentation"
              className="vidrio-solido pointer-events-none absolute z-10 flex -translate-x-1/2 flex-col rounded-xl px-3 py-2 text-xs text-ergon-navy"
              style={{ left: Math.max(90, Math.min(w - 90, tip.x)), top: Math.max(0, tip.y - 62) }}
            >
              <b className="font-bold">{tip.title}</b>
              <small className="text-muted-foreground">{tip.sub}</small>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
