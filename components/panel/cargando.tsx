import { Skeleton } from "@/components/ui/skeleton";

/**
 * Carga con la forma de una página: título (si se da, ya visible) y tarjetas.
 * Se usa en los loading.tsx de cada sección: al tocar el menú aparece al instante
 * mientras el servidor manda los datos.
 */
export function Cargando({ titulo }: { titulo?: string }) {
  return (
    <div role="status" aria-label={titulo ? `Cargando ${titulo}` : "Cargando"} className="space-y-5">
      {titulo ? (
        <h1 className="mb-6 text-[1.75rem] font-black leading-tight tracking-tight text-ergon-navy">{titulo}</h1>
      ) : (
        <Skeleton className="h-8 w-44 rounded-lg" />
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-[1.25rem]" />
        <Skeleton className="h-32 rounded-[1.25rem]" />
      </div>
      <Skeleton className="h-48 rounded-[1.25rem]" />
    </div>
  );
}

/** Variante sin título (para secciones que ya pintan su título en el layout, como Ajustes). */
export function CargandoContenido() {
  return (
    <div role="status" aria-label="Cargando" className="space-y-4">
      <Skeleton className="h-40 rounded-[1.25rem]" />
      <Skeleton className="h-28 rounded-[1.25rem]" />
    </div>
  );
}
