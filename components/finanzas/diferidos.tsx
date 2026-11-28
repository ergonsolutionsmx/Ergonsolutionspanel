"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import type { PuntoMes } from "@/lib/finanzas";

const Grafica = dynamic(() => import("./grafica-meses"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-xl md:h-72" />,
});

/** Recharts se descarga solo cuando la gráfica se acerca a la pantalla. */
export function GraficaMesesDiferida({ datos }: { datos: PuntoMes[] }) {
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
  return <div ref={ref}>{visible ? <Grafica datos={datos} /> : <Skeleton className="h-64 w-full rounded-xl md:h-72" />}</div>;
}
