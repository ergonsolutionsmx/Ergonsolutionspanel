"use client";

import { useActionState, useEffect, useState } from "react";
import { CalendarRange, Link2, MapPin, Video } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { HoraSelect } from "@/components/ui/hora-select";
import { Segmentos } from "@/components/ui/segmentos";
import { toast } from "@/components/avisos/toast";
import type { PerfilCorto } from "@/lib/tareas-tipos";
import { crearReunion, type EstadoReunion } from "@/app/(panel)/agenda/acciones";

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const deIso = (s: string) => new Date(`${s}T12:00:00`);
const sumarMin = (h: string, min: number) => {
  const t = Math.min(23 * 60 + 55, Number(h.slice(0, 2)) * 60 + Number(h.slice(3)) + min);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};
const larga = (d?: Date) => (d ? new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short" }).format(d) : "—");

/** Agendar una reunión: calendario a la izquierda y datos a la derecha (una columna en celular). */
export function MeetingScheduler({
  perfiles,
  yoId,
  fecha,
  onListo,
  onCancelar,
}: {
  perfiles: PerfilCorto[];
  yoId: string;
  fecha: string;
  onListo: () => void;
  onCancelar: () => void;
}) {
  const [estado, enviar, enviando] = useActionState<EstadoReunion, FormData>(crearReunion, undefined);
  const [variosDias, setVariosDias] = useState(false);
  const [dia, setDia] = useState<Date | undefined>(deIso(fecha));
  const [rango, setRango] = useState<DateRange | undefined>({ from: deIso(fecha), to: deIso(fecha) });
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFin, setHoraFin] = useState("11:00");
  const [modalidad, setModalidad] = useState("en_linea");
  const [asiste, setAsiste] = useState("");
  const e = estado?.errores ?? {};

  useEffect(() => {
    if (estado?.ok) {
      toast.success("Reunión agendada");
      onListo();
    }
  }, [estado, onListo]);

  const inicio = variosDias ? rango?.from : dia;
  const fin = variosDias ? (rango?.to ?? rango?.from) : dia;

  return (
    <form action={enviar} className="grid gap-5 md:grid-cols-[auto_1fr] md:gap-6">
      <input type="hidden" name="fecha_inicio" value={inicio ? iso(inicio) : ""} />
      <input type="hidden" name="fecha_fin" value={fin ? iso(fin) : ""} />
      <input type="hidden" name="modalidad" value={modalidad} />
      <input type="hidden" name="responsable_id" value={asiste} />

      <div className="flex flex-col items-center gap-2 rounded-2xl border bg-muted/60 p-1">
        {variosDias ? (
          <Calendar mode="range" selected={rango} onSelect={setRango} numberOfMonths={1} className="[--cell-size:--spacing(9)]" />
        ) : (
          <Calendar mode="single" selected={dia} onSelect={setDia} required className="[--cell-size:--spacing(9)]" />
        )}
        <label className="mb-2 flex items-center gap-2 text-sm font-bold text-ergon-navy">
          <Switch checked={variosDias} onCheckedChange={setVariosDias} />
          <CalendarRange className="size-4" aria-hidden /> Varios días
        </label>
        {e.fecha ? <p className="pb-2 text-xs font-bold text-error">{e.fecha}</p> : null}
      </div>

      <div className="grid content-start gap-4">
        <Campo id="r-titulo" etiqueta="Título" error={e.titulo}>
          <Input id="r-titulo" name="titulo" required maxLength={200} placeholder="Ej.: Llamada con el cliente" aria-invalid={!!e.titulo || undefined} />
        </Campo>

        <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/60 p-3">
          <div>
            <p className="text-xs font-bold text-muted-foreground">Inicio</p>
            <p className="text-sm font-black capitalize text-ergon-navy">{larga(inicio)}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-muted-foreground">Fin</p>
            <p className="text-sm font-black capitalize text-ergon-navy">{larga(fin)}</p>
          </div>
          <Campo id="r-hora-inicio" etiqueta="Hora de inicio" error={e.hora_inicio}>
            <HoraSelect
              id="r-hora-inicio"
              name="hora_inicio"
              valor={horaInicio}
              onCambio={(v) => {
                setHoraInicio(v);
                if (!variosDias && horaFin <= v) setHoraFin(sumarMin(v, 60));
              }}
              invalido={!!e.hora_inicio}
            />
          </Campo>
          <Campo id="r-hora-fin" etiqueta="Hora de fin" error={e.hora_fin}>
            <HoraSelect id="r-hora-fin" name="hora_fin" valor={horaFin} onCambio={setHoraFin} invalido={!!e.hora_fin} />
          </Campo>
        </div>

        <div className="grid gap-2">
          <Label>Modalidad</Label>
          <Segmentos
            etiqueta="Modalidad"
            activo={modalidad}
            onCambio={setModalidad}
            opciones={[
              { valor: "en_linea", etiqueta: (<><Video className="size-4" aria-hidden /> En línea</>) },
              { valor: "presencial", etiqueta: (<><MapPin className="size-4" aria-hidden /> Presencial</>) },
            ]}
          />
        </div>
        {modalidad === "en_linea" ? (
          <Campo id="r-enlace" etiqueta="Link de la reunión" error={e.enlace}>
            <div className="relative">
              <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="r-enlace" name="enlace" type="url" inputMode="url" placeholder="https://meet.google.com/…" className="pl-9" aria-invalid={!!e.enlace || undefined} />
            </div>
          </Campo>
        ) : (
          <Campo id="r-lugar" etiqueta="Lugar">
            <Input id="r-lugar" name="lugar" maxLength={200} placeholder="Dirección o lugar" />
          </Campo>
        )}

        <div className="grid gap-2">
          <Label>Quién asiste</Label>
          <Segmentos
            etiqueta="Quién asiste"
            activo={asiste}
            onCambio={setAsiste}
            opciones={[
              ...perfiles.map((p) => ({ valor: p.usuario_id, etiqueta: p.usuario_id === yoId ? `${p.nombre.split(" ")[0]} (yo)` : p.nombre.split(" ")[0] })),
              { valor: "", etiqueta: "Ambos" },
            ]}
          />
        </div>

        <Campo id="r-notas" etiqueta="Notas">
          <Textarea id="r-notas" name="notas" rows={2} placeholder="Temas, contacto, lo que haya que preparar…" />
        </Campo>

        <label className="flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5">
          <span>
            <span className="block text-sm font-bold text-ergon-navy">Crear tarea de seguimiento</span>
            <span className="block text-xs text-muted-foreground">Una tarea ligada a la reunión, para el mismo día.</span>
          </span>
          <Switch name="seguimiento" />
        </label>

        <ErrorForm mensaje={estado?.error} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button type="submit" loading={enviando}>
            {enviando ? "Agendando…" : "Agendar"}
          </Button>
        </div>
      </div>
    </form>
  );
}
