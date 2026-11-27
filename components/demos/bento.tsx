"use client";

import * as m from "motion/react-m";
import { Dumbbell, Factory, GraduationCap, HardHat, Scissors, Stethoscope, Store, Truck, UtensilsCrossed, ExternalLink, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { fadeUp, stagger } from "@/lib/motion";

/** Giros de la demo. POR CONFIRMAR: textos finales y el link de cada giro. */
export const GIROS: { clave: string; nombre: string; texto: string; icono: LucideIcon; tono: string }[] = [
  { clave: "restaurante", nombre: "Restaurante", texto: "Menú con QR, pedidos y reservaciones.", icono: UtensilsCrossed, tono: "from-orange-400/25" },
  { clave: "consultorio", nombre: "Consultorio", texto: "Citas en línea, recordatorios y expedientes.", icono: Stethoscope, tono: "from-ergon-sky/30" },
  { clave: "barberia", nombre: "Barbería", texto: "Agenda por barbero y lealtad digital.", icono: Scissors, tono: "from-ergon-blue/25" },
  { clave: "gimnasio", nombre: "Gimnasio", texto: "Membresías, cobros y registro de visitas.", icono: Dumbbell, tono: "from-emerald-400/25" },
  { clave: "tienda", nombre: "Tienda", texto: "Catálogo, inventario y ventas.", icono: Store, tono: "from-pink-400/20" },
  { clave: "escuela", nombre: "Escuela", texto: "Pagos, avisos a papás y control escolar.", icono: GraduationCap, tono: "from-violet-400/20" },
  { clave: "distribuidora", nombre: "Distribuidora", texto: "Pedidos de clientes, rutas y cobranza.", icono: Truck, tono: "from-amber-400/25" },
  { clave: "manufactura", nombre: "Manufactura", texto: "Órdenes de producción y tableros.", icono: Factory, tono: "from-slate-400/25" },
  { clave: "constructora", nombre: "Constructora", texto: "Obras, avances y reportes al cliente.", icono: HardHat, tono: "from-yellow-400/25" },
];

/** Lanzador en cuadrícula tipo bento: una tarjeta por giro. */
export function BentoDemos({ url }: { url: string | null }) {
  return (
    <m.ul className="grid auto-rows-[minmax(9.5rem,auto)] gap-3 sm:grid-cols-2 lg:grid-cols-4" variants={stagger(0.04)} initial="oculto" animate="visible">
      {GIROS.map((g, i) => {
        const grande = i === 0;
        const href = url ? `${url}${url.includes("?") ? "&" : "?"}giro=${g.clave}` : null;
        return (
          <m.li key={g.clave} variants={fadeUp} className={cn(grande && "lg:col-span-2 lg:row-span-2")}>
            <div
              className={cn(
                "tarjeta-viva group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/70 bg-card p-5 shadow-sm",
                grande && "lg:p-7",
              )}
            >
              <div className={cn("pointer-events-none absolute -right-10 -top-10 size-44 rounded-full bg-gradient-to-br to-transparent opacity-70 blur-2xl transition-opacity group-hover:opacity-100", g.tono)} aria-hidden />
              <span className={cn("relative grid place-items-center rounded-2xl bg-ergon-navy text-ergon-sky shadow-sm transition-transform group-hover:-rotate-6 group-hover:scale-105", grande ? "size-14" : "size-11")}>
                <g.icono className={grande ? "size-7" : "size-5"} aria-hidden />
              </span>
              <h2 className={cn("relative mt-4 font-black text-ergon-navy", grande ? "text-2xl" : "text-lg")}>{g.nombre}</h2>
              <p className="relative mt-1 text-sm text-muted-foreground">{g.texto}</p>
              <div className="relative mt-auto pt-4">
                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-2 rounded-full bg-gradient-to-b from-[#3B76F0] to-ergon-blue px-4 text-sm font-bold text-white shadow-[var(--shadow-accion)] after:absolute after:inset-0 active:scale-[0.97]"
                  >
                    Abrir demo <ExternalLink className="size-4" aria-hidden />
                  </a>
                ) : (
                  <span className="inline-flex h-10 items-center rounded-full border border-dashed px-4 text-sm font-bold text-muted-foreground">Próximamente</span>
                )}
              </div>
            </div>
          </m.li>
        );
      })}
    </m.ul>
  );
}
