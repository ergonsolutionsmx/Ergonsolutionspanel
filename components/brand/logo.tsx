import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Logo de Ergon Solutions (SVG).
 * - full: horizontal (símbolo + nombre). icon: solo el símbolo. app: isotipo cuadrado navy.
 * - tono "light" para fondo navy, "dark" para fondo claro.
 */
export function Logo({
  variante = "full",
  tono = "dark",
  className,
  prioridad = false,
}: {
  variante?: "full" | "icon" | "app";
  tono?: "light" | "dark";
  className?: string;
  prioridad?: boolean;
}) {
  const src =
    variante === "app"
      ? "/brand/isotipo.svg"
      : variante === "icon"
        ? tono === "light"
          ? "/brand/simbolo-claro.svg"
          : "/brand/simbolo.svg"
        : tono === "light"
          ? "/brand/logo-claro.svg"
          : "/brand/logo.svg";
  const [w, h] = variante === "full" ? [810, 196] : variante === "icon" ? [239, 196] : [426, 426];
  return (
    <Image
      src={src}
      alt={variante === "full" ? "Ergon Solutions" : ""}
      width={w}
      height={h}
      priority={prioridad}
      unoptimized
      className={cn("h-auto", className)}
    />
  );
}
