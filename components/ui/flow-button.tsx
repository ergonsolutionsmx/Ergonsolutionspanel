"use client";

import * as React from "react";
import { ArrowRight } from "lucide-react";
import { Slot } from "radix-ui";
import { cn } from "@/lib/utils";

type FlowButtonProps = React.ComponentProps<"button"> & {
  text: string;
  icon?: React.ReactNode;
  /** Para usarlo como link: <FlowButton asChild text="…"><Link href="…" /></FlowButton> */
  asChild?: boolean;
};

/**
 * Botón destacado con flecha y círculo que crece al pasar el mouse.
 * Solo para acciones principales ("Nueva propuesta", "Lanzar demo"); no en formularios ni listas.
 */
export function FlowButton({ text, icon, asChild, className, children, ...props }: FlowButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  const contenido = (
    <>
      <ArrowRight
        aria-hidden
        className="absolute left-[-25%] z-[9] size-4 text-primary-foreground transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:left-4 motion-reduce:hidden"
      />
      <span className="flow-texto relative z-[1] flex items-center gap-2 transition-transform duration-700 ease-out sm:-translate-x-3 sm:group-hover:translate-x-3 motion-reduce:translate-x-0">
        {icon}
        {text}
      </span>
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary opacity-0 transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:size-[260px] group-hover:opacity-100"
      />
      <ArrowRight
        aria-hidden
        className="absolute right-4 z-[9] hidden size-4 transition-all duration-700 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:right-[-25%] group-hover:text-primary-foreground sm:block"
      />
    </>
  );
  return (
    <Comp
      className={cn(
        // En celular (sin hover) se ve como botón principal normal: azul con texto blanco.
        "group relative inline-flex h-11 cursor-pointer items-center justify-center gap-1 overflow-hidden rounded-full border-[1.5px] border-primary bg-primary px-6 text-sm font-bold text-primary-foreground shadow-[var(--shadow-accion)] outline-none transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.95] disabled:pointer-events-none disabled:opacity-50",
        "sm:bg-card sm:px-8 sm:text-ergon-navy sm:shadow-sm sm:hover:rounded-xl sm:hover:border-transparent sm:hover:text-primary-foreground sm:hover:shadow-[var(--shadow-accion)]",
        className,
      )}
      {...props}
    >
      {asChild && React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ children?: React.ReactNode }>, undefined, contenido)
        : contenido}
    </Comp>
  );
}
