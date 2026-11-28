"use client";

import { useId, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Segmentos } from "@/components/ui/segmentos";

export type PuntoFlujo = { etiqueta: string; a: number; b: number };
/** `acumulado`: cada punto ya es el total que se lleva (el resumen usa el último punto, no la suma). */
export type PeriodoFlujo = { id: string; nombre: string; puntos: PuntoFlujo[]; acumulado?: boolean };

/**
 * Gráfica de líneas estilo "adjustable glass dashboard" (21st.dev):
 * serie A en azul con área degradada, serie B en línea tenue, guías punteadas y 3 valores en el eje.
 * Al pasar el dedo o el mouse muestra los dos valores de ese punto.
 */
export function GraficaFlujo({
  periodos,
  inicial,
  nombreA,
  nombreB,
  formato = "pesos",
  resumen = true,
  alto = 150,
  className,
}: {
  periodos: PeriodoFlujo[];
  inicial?: string;
  nombreA: string;
  nombreB: string;
  formato?: "pesos" | "numero";
  resumen?: boolean;
  alto?: number;
  className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const [periodoId, setPeriodoId] = useState(inicial ?? periodos[0]?.id ?? "");
  const [activo, setActivo] = useState<number | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const periodo = periodos.find((p) => p.id === periodoId) ?? periodos[0];
  const puntos = useMemo(() => periodo?.puntos ?? [], [periodo]);

  const fmt = useMemo(
    () =>
      formato === "pesos"
        ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 })
        : new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }),
    [formato],
  );
  const corto = useMemo(
    () =>
      formato === "pesos"
        ? new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", notation: "compact", maximumFractionDigits: 1 })
        : new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }),
    [formato],
  );

  const ultimo = puntos[puntos.length - 1];
  const totalA = periodo?.acumulado ? (ultimo?.a ?? 0) : puntos.reduce((s, p) => s + Math.max(0, p.a), 0);
  const totalB = periodo?.acumulado ? (ultimo?.b ?? 0) : puntos.reduce((s, p) => s + Math.max(0, p.b), 0);
  const maximo = Math.max(1, ...puntos.flatMap((p) => [p.a, p.b]));
  const W = 600;
  const H = 185;
  const x = (i: number) => (puntos.length === 1 ? W / 2 : (i * W) / (puntos.length - 1));
  const y = (v: number) => 180 - (Math.max(0, v) / maximo) * 160;
  const linea = (k: "a" | "b") => puntos.map((p, i) => `${x(i)},${y(p[k])}`).join(" ");
  const etiquetas = new Set(
    Array.from({ length: Math.min(puntos.length, 6) }, (_, i) => (puntos.length <= 6 ? i : Math.round((i * (puntos.length - 1)) / 5))),
  );

  const mover = (clientX: number) => {
    const r = svg.current?.getBoundingClientRect();
    if (!r || !puntos.length) return;
    const rel = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    setActivo(puntos.length === 1 ? 0 : Math.round(rel * (puntos.length - 1)));
  };
  const p = activo !== null ? puntos[activo] : null;

  return (
    <div className={cn("w-full", className)}>
      {
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          {resumen ? (
            <div className="flex gap-8">
              {[
                { n: nombreA, v: totalA, c: "bg-ergon-sky" },
                { n: nombreB, v: totalB, c: "bg-muted-foreground" },
              ].map((s) => (
                <div key={s.n} className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <i className={cn("size-1.5 rounded-full", s.c)} />
                    {s.n}
                  </span>
                  <strong className="text-xl font-semibold tracking-tight tabular-nums text-ergon-navy md:text-[1.4rem]">{fmt.format(s.v)}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-ergon-sky" />{nombreA}</span>
              <span className="flex items-center gap-1.5"><i className="size-1.5 rounded-full bg-muted-foreground" />{nombreB}</span>
            </div>
          )}
          {periodos.length > 1 ? (
            <Segmentos
              etiqueta="Periodo"
              tamano="sm"
              activo={periodo?.id ?? ""}
              onCambio={(v) => {
                setPeriodoId(v);
                setActivo(null);
              }}
              opciones={periodos.map((x) => ({ valor: x.id, etiqueta: x.nombre }))}
            />
          ) : null}
        </div>
      }

      {puntos.length ? (
        <div className="relative pl-11">
          <div className="pointer-events-none absolute bottom-6 left-0 top-0 flex flex-col justify-between text-[10px] tabular-nums text-muted-foreground" aria-hidden>
            <span>{corto.format(maximo)}</span>
            <span>{corto.format(maximo / 2)}</span>
            <span>{corto.format(0)}</span>
          </div>
          <div className="relative">
            <svg
              ref={svg}
              key={periodo?.id}
              viewBox={`0 0 ${W} ${H}`}
              preserveAspectRatio="none"
              className="block w-full touch-pan-y overflow-visible text-ergon-navy"
              style={{ height: alto }}
              role="img"
              aria-label={`${periodo?.nombre ?? ""}: ${nombreA} ${fmt.format(totalA)}, ${nombreB} ${fmt.format(totalB)}`}
              onPointerMove={(e) => mover(e.clientX)}
              onPointerDown={(e) => mover(e.clientX)}
              onPointerLeave={() => setActivo(null)}
            >
              <desc>{puntos.map((q) => `${q.etiqueta}: ${nombreA} ${fmt.format(q.a)}, ${nombreB} ${fmt.format(q.b)}`).join(". ")}</desc>
              <defs>
                <linearGradient id={`${id}-area`} x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0" stopColor="var(--ergon-sky)" stopOpacity=".3" />
                  <stop offset="1" stopColor="var(--ergon-sky)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[20, 100, 180].map((g) => (
                <path key={g} d={`M0 ${g} H${W}`} stroke="currentColor" opacity=".12" strokeDasharray="3 5" vectorEffect="non-scaling-stroke" />
              ))}
              <path
                className="flujo-area"
                d={`M${x(0)} ${H} ${puntos.map((q, i) => `L${x(i)} ${y(q.a)}`).join(" ")} L${x(puntos.length - 1)} ${H} Z`}
                fill={`url(#${id}-area)`}
              />
              <polyline
                className="flujo-linea"
                pathLength={1}
                points={linea("b")}
                fill="none"
                stroke="currentColor"
                strokeOpacity=".42"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <polyline
                className="flujo-linea"
                pathLength={1}
                points={linea("a")}
                fill="none"
                stroke="var(--ergon-sky)"
                strokeWidth="2.6"
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {activo !== null && p ? (
                <path d={`M${x(activo)} 10 V${H}`} stroke="currentColor" opacity=".25" strokeDasharray="2 4" vectorEffect="non-scaling-stroke" />
              ) : null}
            </svg>

            {/* Puntos activos (en HTML para que no se deformen con el SVG estirado) */}
            {activo !== null && p ? (
              <>
                {(["b", "a"] as const).map((k) => (
                  <span
                    key={k}
                    className={cn("pointer-events-none absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white/80", k === "a" ? "bg-ergon-sky" : "bg-muted-foreground")}
                    style={{ left: `${(x(activo) / W) * 100}%`, top: (y(p[k]) / H) * alto }}
                    aria-hidden
                  />
                ))}
                <div
                  className="vidrio-solido pointer-events-none absolute z-10 min-w-36 rounded-xl px-3 py-2 text-xs"
                  style={{
                    left: `${(x(activo) / W) * 100}%`,
                    top: -6,
                    transform: `translate(${activo > puntos.length / 2 ? "calc(-100% - 10px)" : "10px"}, 0)`,
                  }}
                  role="status"
                >
                  <b className="block text-ergon-navy">{p.etiqueta}</b>
                  <span className="flex justify-between gap-3 text-muted-foreground">
                    {nombreA} <b className="tabular-nums text-ergon-navy">{fmt.format(p.a)}</b>
                  </span>
                  <span className="flex justify-between gap-3 text-muted-foreground">
                    {nombreB} <b className="tabular-nums text-ergon-navy">{fmt.format(p.b)}</b>
                  </span>
                </div>
              </>
            ) : null}
          </div>
          <div className="relative h-6 pt-2.5 text-[10px] text-muted-foreground" aria-hidden>
            {puntos.map((q, i) =>
              etiquetas.has(i) ? (
                <span
                  key={`${q.etiqueta}-${i}`}
                  className="absolute whitespace-nowrap"
                  style={{
                    left: `${(x(i) / W) * 100}%`,
                    transform: i === 0 && puntos.length > 1 ? "none" : i === puntos.length - 1 && puntos.length > 1 ? "translateX(-100%)" : "translateX(-50%)",
                  }}
                >
                  {q.etiqueta}
                </span>
              ) : null,
            )}
          </div>
        </div>
      ) : (
        <p className="grid h-40 place-items-center text-sm text-muted-foreground">Aún no hay datos en este periodo.</p>
      )}
    </div>
  );
}
