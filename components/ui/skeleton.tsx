import { cn } from "@/lib/utils";

/** Bloque de carga con brillo suave que recorre la forma del contenido. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="skeleton" className={cn("esqueleto rounded-md", className)} {...props} />;
}

export { Skeleton };
