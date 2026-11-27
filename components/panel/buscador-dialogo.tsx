"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarPlus, FilePlus2, ListPlus, Users } from "lucide-react";
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

/** Ventana del buscador (se carga al abrirla por primera vez). */
export default function BuscadorDialogo({ abierto, setAbierto }: { abierto: boolean; setAbierto: (v: boolean) => void }) {
  const [servicios, setServicios] = useState<{ id: string; numero: string; nombre: string }[] | null>(null);
  const router = useRouter();

  // Los servicios se piden la primera vez que se abre el buscador.
  useEffect(() => {
    if (abierto && servicios === null) void serviciosParaBuscar().then(setServicios);
  }, [abierto, servicios]);


  const ir = (href: string) => {
    setAbierto(false);
    router.push(href);
  };

  return (
    <>
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
