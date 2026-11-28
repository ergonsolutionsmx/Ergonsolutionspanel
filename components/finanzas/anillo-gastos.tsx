/*
 * Adaptado de "Spending Ring" de Kokonut UI (https://kokonutui.com), licencia MIT,
 * Copyright (c) 2025 kokonutUI. Cambios: colores Ergon, pesos MXN, español y vidrio.
 */
"use client";

import { type KeyboardEvent, type PointerEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { colorCategoria, nombreCategoria } from "@/lib/finanzas-tipos";

const SIZE = 240;
const C = SIZE / 2;
const R = 90;
const STROKE = 22;
const GAP = 2.4; // grados vacíos entre categorías
const RATE = 11; // resorte del giro (rad/s)
const DAMPING = 0.78;
const PROJECT = 0.2; // cuánto se proyecta un giro rápido al soltar (s)
const TAP_SLOP = 5; // menos de esto es un toque, no un giro

export type GastoCategoria = { clave: string; monto: number; anterior: number };

const wrap = (deg: number) => ((((deg + 180) % 360) + 360) % 360) - 180;

function polar(deg: number, r = R) {
  const rad = (deg * Math.PI) / 180;
  return [C + r * Math.sin(rad), C - r * Math.cos(rad)] as const;
}

function arc(from: number, to: number) {
  const [x0, y0] = polar(from);
  const [x1, y1] = polar(to);
  const large = to - from > 180 ? 1 : 0;
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${R} ${R} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

function sliceAt(spans: { from: number; to: number }[], deg: number) {
  const a = ((deg % 360) + 360) % 360;
  const index = spans.findIndex((s) => a >= s.from && a < s.to);
  return index === -1 ? 0 : index;
}

function springStep(state: { a: number; v: number }, target: number, dt: number) {
  const slices = Math.ceil(dt / (1 / 240));
  const h = dt / slices;
  for (let i = 0; i < slices; i++) {
    const accel = -RATE * RATE * (state.a - target) - 2 * DAMPING * RATE * state.v;
    state.v += accel * h;
    state.a += state.v * h;
  }
  return Math.abs(state.a - target) < 0.05 && Math.abs(state.v) < 2;
}

const money = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const moneyCorto = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

/** Gastos del mes por categoría: el anillo se gira con el dedo o el mouse y se acomoda en una categoría. */
export function AnilloGastos({ categorias, className }: { categorias: GastoCategoria[]; className?: string }) {
  const [selected, setSelected] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const ringRef = useRef<SVGGElement>(null);
  const selectedRef = useRef(0);

  const total = categorias.reduce((sum, c) => sum + c.monto, 0);
  const spans = useMemo(() => {
    let at = 0;
    return categorias.map((c) => {
      const sweep = total ? (c.monto / total) * 360 : 360 / categorias.length;
      const span = { from: at, to: at + sweep, mid: at + sweep / 2 };
      at += sweep;
      return span;
    });
  }, [categorias, total]);

  const sim = useRef({
    a: -(spans[0]?.mid ?? 0),
    v: 0,
    target: -(spans[0]?.mid ?? 0),
    raf: 0,
    last: 0,
    coast: false,
    drag: null as null | { id: number; angle: number; time: number; moved: number; x: number; y: number },
  });

  const paint = useCallback(() => {
    ringRef.current?.setAttribute("transform", `rotate(${sim.current.a.toFixed(3)} ${C} ${C})`);
  }, []);

  const track = useCallback(() => {
    const index = sliceAt(spans, -sim.current.a);
    if (index !== selectedRef.current) {
      selectedRef.current = index;
      setSelected(index);
    }
  }, [spans]);

  const tick = useCallback(
    function paso(now: number) {
      const s = sim.current;
      s.raf = 0;
      if (s.drag) return;
      const dt = s.last ? Math.min((now - s.last) / 1000, 1 / 30) : 1 / 60;
      s.last = now;
      const state = { a: s.a, v: s.v };
      const settled = springStep(state, s.target, dt);
      s.a = settled ? s.target : state.a;
      s.v = settled ? 0 : state.v;
      paint();
      if (s.coast) track();
      if (settled) {
        s.last = 0;
        s.coast = false;
        setSpinning(false);
      } else {
        s.raf = requestAnimationFrame(paso);
      }
    },
    [paint, track],
  );

  const turnTo = useCallback(
    (index: number, rest = sim.current.a, coast = false) => {
      const s = sim.current;
      const goal = -(spans[index]?.mid ?? 0);
      s.target = rest + wrap(goal - rest);
      s.coast = coast;
      if (!coast) {
        selectedRef.current = index;
        setSelected(index);
      }
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        s.a = s.target;
        s.v = 0;
        s.coast = false;
        paint();
        track();
        return;
      }
      setSpinning(true);
      if (!s.raf) {
        s.last = 0;
        s.raf = requestAnimationFrame(tick);
      }
    },
    [paint, spans, tick, track],
  );

  useEffect(() => {
    const s = sim.current;
    const index = Math.min(selectedRef.current, Math.max(0, spans.length - 1));
    s.a = -(spans[index]?.mid ?? 0);
    s.target = s.a;
    s.v = 0;
    selectedRef.current = index;
    setSelected(index);
    paint();
  }, [spans, paint]);

  useEffect(() => {
    const s = sim.current;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  const pointerAngle = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    return (Math.atan2(x, -y) * 180) / Math.PI;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.drag || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.v = 0;
    s.drag = { id: event.pointerId, angle: pointerAngle(event), time: event.timeStamp, moved: 0, x: event.clientX, y: event.clientY };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const drag = s.drag;
    if (!drag || drag.id !== event.pointerId) return;
    drag.moved = Math.max(drag.moved, Math.hypot(event.clientX - drag.x, event.clientY - drag.y));
    if (drag.moved < TAP_SLOP) return;
    const angle = pointerAngle(event);
    const delta = wrap(angle - drag.angle);
    const dt = Math.max((event.timeStamp - drag.time) / 1000, 1 / 240);
    s.a += delta;
    s.v = s.v * 0.6 + (delta / dt) * 0.4;
    drag.angle = angle;
    drag.time = event.timeStamp;
    setSpinning(true);
    paint();
    track();
  };

  const release = (event: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    const drag = s.drag;
    if (!drag || drag.id !== event.pointerId) return;
    s.drag = null;
    if (drag.moved < TAP_SLOP) {
      const rect = event.currentTarget.getBoundingClientRect();
      const r = Math.hypot(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2);
      if (r > ((R - STROKE) / SIZE) * rect.width) turnTo(sliceAt(spans, pointerAngle(event) - s.a));
      return;
    }
    if (event.timeStamp - drag.time > 80) s.v = 0;
    s.v = Math.max(-1440, Math.min(1440, s.v));
    const rest = s.a + s.v * PROJECT;
    turnTo(sliceAt(spans, -rest), rest, true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
    let next: number | null = null;
    if (event.key in step) next = (selected + step[event.key] + categorias.length) % categorias.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = categorias.length - 1;
    if (next !== null) {
      event.preventDefault();
      turnTo(next);
    }
  };

  const current = categorias[selected];
  const share = total && current ? (current.monto / total) * 100 : 0;
  const change = current && current.anterior ? ((current.monto - current.anterior) / current.anterior) * 100 : null;

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-black text-ergon-navy">Gastos por categoría</h2>
        <p className="text-sm font-bold tabular-nums text-ergon-navy">{moneyCorto.format(total)}</p>
      </div>

      <div
        aria-label="Gastos por categoría. Usa las flechas para girar el anillo."
        aria-valuemax={categorias.length}
        aria-valuemin={1}
        aria-valuenow={selected + 1}
        aria-valuetext={current ? `${nombreCategoria(current.clave)}, ${money.format(current.monto)}` : ""}
        className={cn(
          "relative mx-auto mt-3 aspect-square w-full max-w-[240px] touch-none select-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-transparent",
          spinning ? "cursor-grabbing" : "cursor-grab",
        )}
        onKeyDown={handleKeyDown}
        onLostPointerCapture={release}
        onPointerCancel={release}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={release}
        role="slider"
        tabIndex={0}
      >
        <svg aria-hidden="true" className="absolute inset-0 size-full drop-shadow-[0_8px_24px_rgb(35_119_194/0.25)]" viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={C} cy={C} r={R} fill="none" stroke="currentColor" strokeWidth={STROKE} className="text-ergon-navy/[0.05]" />
          <g ref={ringRef} transform={`rotate(${sim.current.a} ${C} ${C})`}>
            {spans.map((span, i) => {
              const category = categorias[i];
              const on = i === selected;
              return (
                <path
                  key={category.clave}
                  className={cn("transition-[stroke-width,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]", !on && "opacity-45")}
                  d={categorias.length === 1 ? arc(0.01, 359.99) : arc(span.from + GAP / 2, span.to - GAP / 2)}
                  fill="none"
                  stroke={colorCategoria(category.clave)}
                  strokeWidth={on ? STROKE + 8 : STROKE}
                />
              );
            })}
          </g>
          <path className="fill-ergon-navy" d={`M${C - 5} 2 L${C + 5} 2 L${C} 8 Z`} />
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-10 text-center">
          <div className="transition-[opacity,translate] duration-200 ease-out starting:translate-y-1 starting:opacity-0" key={current?.clave}>
            <p className="flex items-center justify-center gap-1.5 text-xs font-bold text-muted-foreground">
              <span className="size-1.5 shrink-0 rounded-full" style={{ background: current ? colorCategoria(current.clave) : undefined }} />
              <span className="line-clamp-1">{current ? nombreCategoria(current.clave) : ""}</span>
            </p>
            <p className="mt-0.5 text-2xl font-black tabular-nums tracking-tight text-ergon-navy">{current ? moneyCorto.format(current.monto) : ""}</p>
            <p className="mt-0.5 text-xs tabular-nums text-muted-foreground">{share.toFixed(0)}% del total</p>
            <p
              className={cn(
                "mt-0.5 text-xs font-bold tabular-nums",
                change === null ? "text-muted-foreground" : change > 0 ? "text-error" : change < 0 ? "text-exito" : "text-muted-foreground",
              )}
            >
              {change === null ? "Nuevo este mes" : change === 0 ? "Igual que el mes pasado" : `${change > 0 ? "▲" : "▼"} ${Math.abs(change).toFixed(0)}% vs. mes pasado`}
            </p>
          </div>
        </div>
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-1 sm:grid-cols-2">
        {categorias.map((category, i) => (
          <li key={category.clave}>
            <button
              aria-pressed={i === selected}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring",
                i === selected ? "bg-ergon-navy/[0.07] font-bold text-ergon-navy" : "text-muted-foreground hover:bg-ergon-navy/[0.04] hover:text-ergon-navy",
              )}
              onClick={() => turnTo(i)}
              type="button"
            >
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: colorCategoria(category.clave) }} />
              <span className="min-w-0 flex-1 truncate">{nombreCategoria(category.clave)}</span>
              <span className="tabular-nums">{moneyCorto.format(category.monto)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
