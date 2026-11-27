"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PuntoSemana } from "@/lib/inicio";

const Grafica = dynamic(() => import("./grafica-tareas"), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full rounded-xl md:h-64" />,
});

/** La gráfica (recharts) se carga solo cuando se acerca a la pantalla: la primera carga queda ligera. */
export function GraficaDiferida({ datos }: { datos: PuntoSemana[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return <div ref={ref}>{visible ? <Grafica datos={datos} /> : <Skeleton className="h-56 w-full rounded-xl md:h-64" />}</div>;
}
