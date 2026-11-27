"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/** Fecha con calendario en popover. Manda "YYYY-MM-DD" en un input oculto con `name`. */
export function DatePicker({
  id,
  name,
  valor,
  onCambio,
  placeholder = "Elegir fecha",
  invalido,
  opcional = false,
}: {
  id: string;
  name: string;
  valor: string;
  onCambio: (v: string) => void;
  placeholder?: string;
  invalido?: boolean;
  opcional?: boolean;
}) {
  const [abierto, setAbierto] = useState(false);
  const fecha = valor ? new Date(`${valor}T12:00:00`) : undefined;
  const texto = fecha ? new Intl.DateTimeFormat("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(fecha) : placeholder;
  return (
    <>
      <input type="hidden" name={name} value={valor} />
      <Popover open={abierto} onOpenChange={setAbierto}>
        <PopoverTrigger
          id={id}
          aria-invalid={invalido || undefined}
          className={cn(
            "flex h-11 w-full items-center gap-2 rounded-xl border border-input bg-card px-3 text-left text-base outline-none focus-visible:border-ergon-blue focus-visible:ring-4 focus-visible:ring-ergon-blue/15 aria-invalid:border-error md:h-10 md:text-sm",
            !fecha && "text-muted-foreground",
          )}
        >
          <CalendarDays className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          <span className="truncate first-letter:uppercase">{texto}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto rounded-2xl p-1" align="start">
          <Calendar
            mode="single"
            selected={fecha}
            defaultMonth={fecha}
            onSelect={(d) => {
              if (d) onCambio(iso(d));
              else if (opcional) onCambio("");
              setAbierto(false);
            }}
            autoFocus
          />
          {opcional && valor ? (
            <button type="button" onClick={() => { onCambio(""); setAbierto(false); }} className="mb-2 ml-3 text-xs font-bold text-muted-foreground hover:text-error">
              Quitar fecha
            </button>
          ) : null}
        </PopoverContent>
      </Popover>
    </>
  );
}
