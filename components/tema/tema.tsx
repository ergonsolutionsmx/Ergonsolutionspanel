"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { Segmentos } from "@/components/ui/segmentos";

export type Tema = "claro" | "oscuro" | "sistema";
const CLAVE = "tema";
const oyentes = new Set<() => void>();

function leer(): Tema {
  try {
    const t = localStorage.getItem(CLAVE);
    return t === "claro" || t === "oscuro" ? t : "sistema";
  } catch {
    return "sistema";
  }
}

function aplicar(t: Tema) {
  const oscuro = t === "oscuro" || (t === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", oscuro);
}

export function cambiarTema(t: Tema) {
  try {
    localStorage.setItem(CLAVE, t);
  } catch {}
  aplicar(t);
  oyentes.forEach((f) => f());
}

export function useTema() {
  const tema = useSyncExternalStore(
    (cb) => {
      oyentes.add(cb);
      return () => oyentes.delete(cb);
    },
    leer,
    () => "sistema" as Tema,
  );
  // En "automático", seguir los cambios del sistema (p. ej. el celular pasa a oscuro de noche).
  useEffect(() => {
    if (tema !== "sistema") return;
    const m = window.matchMedia("(prefers-color-scheme: dark)");
    const f = () => aplicar("sistema");
    m.addEventListener("change", f);
    return () => m.removeEventListener("change", f);
  }, [tema]);
  return tema;
}

const SIGUIENTE: Record<Tema, Tema> = { claro: "oscuro", oscuro: "sistema", sistema: "claro" };
const NOMBRE: Record<Tema, string> = { claro: "Claro", oscuro: "Oscuro", sistema: "Automático" };
const ICONO = { claro: Sun, oscuro: Moon, sistema: Monitor };

/** Botón del encabezado: cambia Claro → Oscuro → Automático. */
export function BotonTema({ className }: { className?: string }) {
  const tema = useTema();
  const Icono = ICONO[tema];
  return (
    <button
      type="button"
      onClick={() => cambiarTema(SIGUIENTE[tema])}
      aria-label={`Tema: ${NOMBRE[tema]}. Cambiar a ${NOMBRE[SIGUIENTE[tema]]}`}
      title={`Tema: ${NOMBRE[tema]}`}
      className={cn("relative rounded-full p-2 text-ergon-navy outline-none hover:bg-white/70 focus-visible:ring-2 focus-visible:ring-ring", className)}
    >
      <Icono className="size-5 transition-transform duration-300 hover:rotate-12" aria-hidden />
    </button>
  );
}

/** Selector en Ajustes → Perfil. */
export function SelectorTema() {
  const tema = useTema();
  return (
    <Segmentos
      etiqueta="Tema"
      activo={tema}
      onCambio={(v) => cambiarTema(v as Tema)}
      opciones={(["claro", "oscuro", "sistema"] as const).map((t) => {
        const I = ICONO[t];
        return { valor: t, etiqueta: (<><I className="size-4" aria-hidden /> {NOMBRE[t]}</>) };
      })}
    />
  );
}
