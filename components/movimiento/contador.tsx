"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

const reducido = () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Número que sube desde 0 al aparecer (count-up). Sin dependencias para que pese poco. */
export function Contador({ valor, className }: { valor: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visto, setVisto] = useState(false);

  // Antes de pintar: arranca en 0 (sin JS se queda el número real).
  useLayoutEffect(() => {
    if (!reducido() && ref.current && valor > 0) ref.current.textContent = "0";
  }, [valor]);

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
      el.textContent = String(valor);
      return;
    }
    const dur = Math.min(1100, 400 + valor * 40);
    const inicio = performance.now();
    let id = 0;
    const paso = (t: number) => {
      const x = Math.min(1, (t - inicio) / dur);
      const suave = 1 - Math.pow(1 - x, 3);
      el.textContent = String(Math.round(valor * suave));
      if (x < 1) id = requestAnimationFrame(paso);
    };
    id = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(id);
  }, [valor, visto]);

  return (
    <span ref={ref} className={className} aria-label={String(valor)}>
      {valor}
    </span>
  );
}
