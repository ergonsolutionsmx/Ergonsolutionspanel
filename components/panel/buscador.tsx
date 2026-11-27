"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarPlus, FilePlus2, ListPlus, Search, Users } from "lucide-react";
import { serviciosParaBuscar } from "./buscador-acciones";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { SECCIONES } from "./secciones";

const ACCIONES = [
  { nombre: "Nueva tarea", href: "/agenda/eventos/nuevo?tipo=tarea", icono: ListPlus },
  { nombre: "Nuevo evento", href: "/agenda/eventos/nuevo", icono: CalendarPlus },
  { nombre: "Agendar reunión", href: "/agenda?reunion=1", icono: Users },
  { nombre: "Nueva propuesta", href: "/propuestas/nueva", icono: FilePlus2 },
];

/** Buscador global (Ctrl/Cmd + K): ir a una sección o crear algo. */
export function Buscador() {
  const [abierto, setAbierto] = useState(false);
  const [servicios, setServicios] = useState<{ id: string; numero: string; nombre: string }[] | null>(null);
  const router = useRouter();

  // Los servicios se piden la primera vez que se abre el buscador.
  useEffect(() => {
    if (abierto && servicios === null) void serviciosParaBuscar().then(setServicios);
  }, [abierto, servicios]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setAbierto((v) => !v);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const ir = (href: string) => {
    setAbierto(false);
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex h-10 w-72 items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 text-sm text-muted-foreground shadow-sm outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Buscar o crear…</span>
        <kbd className="rounded-md border bg-card px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">Ctrl K</kbd>
      </button>
      <CommandDialog open={abierto} onOpenChange={setAbierto}>
        <CommandInput placeholder="Escribe una sección o acción…" />
        <CommandList>
          <CommandEmpty>Sin resultados.</CommandEmpty>
          <CommandGroup heading="Crear">
            {ACCIONES.map(({ nombre, href, icono: Icono }) => (
              <CommandItem key={href} onSelect={() => ir(href)}>
                <Icono aria-hidden /> {nombre}
              </CommandItem>
            ))}
          </CommandGroup>
          {servicios?.length ? (
            <CommandGroup heading="Servicios del catálogo">
              {servicios.map((sv) => (
                <CommandItem key={sv.id} value={`${sv.numero} ${sv.nombre}`} onSelect={() => ir(`/catalogo/${sv.id}`)}>
                  <BookOpen aria-hidden /> {sv.nombre}
                  <CommandShortcut>{sv.numero}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          ) : null}
          <CommandGroup heading="Ir a">
            {SECCIONES.map(({ nombre, href, icono: Icono }) => (
              <CommandItem key={href} onSelect={() => ir(href)}>
                <Icono aria-hidden /> {nombre}
                <CommandShortcut>{href}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
