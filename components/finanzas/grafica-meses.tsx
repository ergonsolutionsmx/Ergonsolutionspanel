"use client";

import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import type { PuntoMes } from "@/lib/finanzas";

const config = {
  ingresos: { label: "Ingresos", color: "#2377c2" },
  gastos: { label: "Gastos", color: "#f59e0b" },
  utilidad: { label: "Utilidad", color: "#10b981" },
} satisfies ChartConfig;

const corto = new Intl.NumberFormat("es-MX", { notation: "compact", maximumFractionDigits: 1 });
const mxn = new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 });

/** Ingresos y gastos por mes (barras) con la utilidad encima (línea). Inspirada en Sales Overview de 21st.dev. */
export default function GraficaMeses({ datos }: { datos: PuntoMes[] }) {
  return (
    <ChartContainer config={config} className="h-64 w-full md:h-72">
      <ComposedChart data={datos} margin={{ left: -6, right: 6, top: 10 }} barGap={3}>
        <CartesianGrid vertical={false} strokeDasharray="3 5" />
        <XAxis dataKey="mes" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} width={44} fontSize={12} tickFormatter={(v: number) => corto.format(v)} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", radius: 10 }}
          content={<ChartTooltipContent indicator="dot" formatter={(v, nombre) => (
            <span className="flex w-full justify-between gap-4">
              <span className="text-muted-foreground">{config[nombre as keyof typeof config]?.label ?? nombre}</span>
              <span className="font-bold tabular-nums">{mxn.format(Number(v))}</span>
            </span>
          )} />}
        />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="ingresos" fill="var(--color-ingresos)" fillOpacity={0.92} radius={[7, 7, 3, 3]} maxBarSize={22} animationDuration={700} />
        <Bar dataKey="gastos" fill="var(--color-gastos)" fillOpacity={0.88} radius={[7, 7, 3, 3]} maxBarSize={22} animationDuration={700} animationBegin={120} />
        <Line dataKey="utilidad" type="monotone" stroke="var(--color-utilidad)" strokeWidth={2.4} dot={{ r: 2.5, strokeWidth: 0, fill: "var(--color-utilidad)" }} activeDot={{ r: 5 }} animationDuration={900} animationBegin={300} />
      </ComposedChart>
    </ChartContainer>
  );
}
