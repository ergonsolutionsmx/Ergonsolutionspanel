import { Skeleton } from "@/components/ui/skeleton";

/** Carga genérica con la forma de una página: título y tarjetas. */
export function Cargando() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-5">
      <Skeleton className="h-8 w-44 rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-[1.25rem]" />
        <Skeleton className="h-32 rounded-[1.25rem]" />
      </div>
      <Skeleton className="h-48 rounded-[1.25rem]" />
    </div>
  );
}
