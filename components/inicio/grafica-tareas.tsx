"use client";

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { PuntoSemana } from "@/lib/inicio";

const config = {
  abiertas: { label: "Abiertas", color: "var(--chart-1)" },
  completadas: { label: "Completadas", color: "var(--chart-2)" },
} satisfies ChartConfig;

/** Tareas abiertas vs. completadas (8 semanas). Se dibuja al entrar. */
export default function GraficaTareas({ datos }: { datos: PuntoSemana[] }) {
  return (
    <ChartContainer config={config} className="h-56 w-full md:h-64">
      <AreaChart data={datos} margin={{ left: -18, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="relleno-abiertas" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-abiertas)" stopOpacity={0.28} />
            <stop offset="1" stopColor="var(--color-abiertas)" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="relleno-completadas" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--color-completadas)" stopOpacity={0.3} />
            <stop offset="1" stopColor="var(--color-completadas)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="3 5" />
        <XAxis dataKey="semana" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={36} fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Area dataKey="abiertas" type="monotone" stroke="var(--color-abiertas)" strokeWidth={2.4} fill="url(#relleno-abiertas)" animationDuration={900} />
        <Area dataKey="completadas" type="monotone" stroke="var(--color-completadas)" strokeWidth={2.4} fill="url(#relleno-completadas)" animationDuration={900} />
      </AreaChart>
    </ChartContainer>
  );
}
