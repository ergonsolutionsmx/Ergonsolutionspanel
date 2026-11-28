"use client";

import { useSyncExternalStore } from "react";
import { Layers, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/** Ajustes del material de vidrio (idea del adjustable-glass-dashboard de 21st.dev). Se guardan en este dispositivo. */
export type Vidrio = { blur: number; opacidad: number; saturacion: number; borde: number };

const CLAVE = "vidrio";
export const VIDRIO_BASE: Vidrio = { blur: 22, opacidad: 0.3, saturacion: 1.2, borde: 0.6 };
const PRESETS: { nombre: string; valor: Vidrio }[] = [
  { nombre: "Transparente", valor: { blur: 10, opacidad: 0.14, saturacion: 1.3, borde: 0.8 } },
  { nombre: "Esmerilado", valor: VIDRIO_BASE },
  { nombre: "Sólido", valor: { blur: 32, opacidad: 0.82, saturacion: 1, borde: 0.35 } },
];
const LIMITES: Record<keyof Vidrio, [number, number]> = { blur: [0, 40], opacidad: [0.08, 0.9], saturacion: [0.5, 2], borde: [0, 1] };


const oyentes = new Set<() => void>();
let cache: { texto: string | null; valor: Vidrio } = { texto: null, valor: VIDRIO_BASE };

function limpiar(v: Partial<Vidrio>): Vidrio {
  const r = { ...VIDRIO_BASE };
  (Object.keys(LIMITES) as (keyof Vidrio)[]).forEach((k) => {
    const n = Number(v[k]);
    if (Number.isFinite(n)) r[k] = Math.min(LIMITES[k][1], Math.max(LIMITES[k][0], n));
  });
  return r;
}

function leer(): Vidrio {
  try {
    const texto = localStorage.getItem(CLAVE);
    if (texto !== cache.texto) cache = { texto, valor: texto ? limpiar(JSON.parse(texto)) : VIDRIO_BASE };
  } catch {}
  return cache.valor;
}

function aplicar(v: Vidrio) {
  const s = document.documentElement.style;
  s.setProperty("--vidrio-blur", `${v.blur}px`);
  s.setProperty("--vidrio-opacidad", String(v.opacidad));
  s.setProperty("--vidrio-saturacion", String(v.saturacion));
  s.setProperty("--vidrio-borde", String(v.borde));
}

function guardar(v: Vidrio) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(v));
  } catch {}
  aplicar(v);
  oyentes.forEach((f) => f());
}

function useVidrio() {
  return useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    leer,
    () => VIDRIO_BASE,
  );
}

const igual = (a: Vidrio, b: Vidrio) => (Object.keys(a) as (keyof Vidrio)[]).every((k) => Math.abs(a[k] - b[k]) < 0.001);

/** Ajustes → Apariencia: presets y controles del vidrio, con muestra en vivo. */
export function AjustarVidrio() {
  const v = useVidrio();
  const controles: { k: keyof Vidrio; nombre: string; paso: number; texto: string }[] = [
    { k: "blur", nombre: "Desenfoque", paso: 1, texto: `${Math.round(v.blur)} px` },
    { k: "opacidad", nombre: "Opacidad", paso: 0.01, texto: `${Math.round(v.opacidad * 100)}%` },
    { k: "saturacion", nombre: "Saturación", paso: 0.05, texto: `${Math.round(v.saturacion * 100)}%` },
    { k: "borde", nombre: "Luz del borde", paso: 0.05, texto: `${Math.round(v.borde * 100)}%` },
  ];
  return (
    <div className="grid gap-5 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div>
        {/* Muestra: manchas de color detrás de un vidrio con los valores actuales */}
        <div className="relative h-36 overflow-hidden rounded-2xl" aria-hidden>
          <span className="absolute -left-4 top-3 size-24 rounded-full bg-ergon-sky" />
          <span className="absolute right-6 top-10 size-20 rounded-full bg-ergon-blue" />
          <span className="absolute bottom-[-1.5rem] left-1/3 size-24 rounded-full bg-amber-400" />
          <div className="vidrio absolute inset-4 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-ergon-navy">
            <Layers className="size-6" strokeWidth={1.3} />
            Vista previa del vidrio
          </div>
        </div>
        <div className="mt-3 flex gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p.nombre}
              type="button"
              onClick={() => guardar(p.valor)}
              aria-pressed={igual(v, p.valor)}
              className={cn(
                "flex-1 rounded-xl border px-2 py-2 text-xs font-bold transition-colors",
                igual(v, p.valor) ? "border-ergon-navy bg-ergon-navy text-white" : "border-ergon-navy/15 text-ergon-navy hover:bg-ergon-navy/[0.05]",
              )}
            >
              {p.nombre}
            </button>
          ))}
        </div>
      </div>
      <div className="grid gap-4">
        {controles.map((c) => (
          <label key={c.k} className="block">
            <span className="flex justify-between text-sm font-semibold text-ergon-navy">
              {c.nombre}
              <output className="text-xs font-normal tabular-nums text-muted-foreground">{c.texto}</output>
            </span>
            <input
              type="range"
              min={LIMITES[c.k][0]}
              max={LIMITES[c.k][1]}
              step={c.paso}
              value={v[c.k]}
              onChange={(e) => guardar(limpiar({ ...v, [c.k]: Number(e.target.value) }))}
              className="mt-2 w-full cursor-pointer accent-[var(--ergon-blue)]"
            />
          </label>
        ))}
        <button
          type="button"
          onClick={() => guardar(VIDRIO_BASE)}
          className="flex items-center justify-center gap-2 rounded-xl border border-ergon-navy/15 py-2 text-xs font-bold text-ergon-navy hover:bg-ergon-navy/[0.05]"
        >
          <RotateCcw className="size-3.5" aria-hidden /> Restablecer
        </button>
      </div>
    </div>
  );
}
