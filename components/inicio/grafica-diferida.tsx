"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

/** La gráfica (recharts) se carga aparte para no hacer más pesada la primera carga. */
export const GraficaDiferida = dynamic(() => import("./grafica-tareas"), {
  ssr: false,
  loading: () => <Skeleton className="h-56 w-full rounded-xl md:h-64" />,
});
