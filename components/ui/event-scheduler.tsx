"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { CalendarClock, ListTodo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Campo, ErrorForm } from "@/components/ui/campo";
import { DatePicker } from "@/components/ui/date-picker";
import { HoraSelect } from "@/components/ui/hora-select";
import { Segmentos } from "@/components/ui/segmentos";
import { ESTADOS_TAREA, NOMBRE_ESTADO, NOMBRE_PRIORIDAD, PRIORIDADES, type Catalogos, type EstadoTarea } from "@/lib/tareas-tipos";
import { crearEvento, type EstadoForm } from "@/app/(panel)/agenda/acciones";
import { crearTarea } from "@/app/(panel)/proyectos/acciones";

type Modo = "evento" | "tarea";

const sumarMin = (h: string, min: number) => {
  const t = Math.min(23 * 60 + 55, Number(h.slice(0, 2)) * 60 + Number(h.slice(3)) + min);
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/** Un solo formulario para crear evento o tarea, con selector arriba (Evento | Tarea). */
export function EventScheduler({
  modoInicial = "evento",
  catalogos,
  fecha,
  volver,
  proyectoId,
  estadoInicial = "por_hacer",
}: {
  modoInicial?: Modo;
  catalogos: Catalogos;
  fecha: string;
  volver: string;
  proyectoId?: string | null;
  estadoInicial?: EstadoTarea;
}) {
  const [modo, setModo] = useState<Modo>(modoInicial);
  const [estadoEvento, enviarEvento, enviandoEvento] = useActionState<EstadoForm, FormData>(crearEvento, undefined);
  const [estadoTarea, enviarTarea, enviandoTarea] = useActionState<EstadoForm, FormData>(crearTarea, undefined);
  const [errores, setErrores] = useState<Record<string, string>>({});

  // Comunes
  const [titulo, setTitulo] = useState("");
  const [dia, setDia] = useState(fecha);
  const [responsable, setResponsable] = useState(catalogos.yoId);
  // Evento
  const [todoElDia, setTodoElDia] = useState(false);
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [horaFin, setHoraFin] = useState("10:00");
  // Tarea
  const [prioridad, setPrioridad] = useState("media");

  const enviando = modo === "evento" ? enviandoEvento : enviandoTarea;
  const errorServidor = modo === "evento" ? estadoEvento?.error : estadoTarea?.error;
  const proyectos = catalogos.proyectos.filter((p) => p.estado !== "terminado");

  const validar = (e: React.FormEvent<HTMLFormElement>) => {
    const err: Record<string, string> = {};
    if (!titulo.trim()) err.titulo = "Escribe un título.";
    if (modo === "evento" && !dia) err.fecha = "Elige la fecha.";
    if (modo === "evento" && !todoElDia && horaFin <= horaInicio) err.hora_fin = "El fin debe ser después del inicio.";
    setErrores(err);
    if (Object.keys(err).length) e.preventDefault();
  };

  return (
    <div className="grid gap-5">
      <Segmentos
        etiqueta="Qué quieres crear"
        activo={modo}
        onCambio={(v) => {
          setModo(v as Modo);
          setErrores({});
        }}
        className="self-start"
        opciones={[
          { valor: "evento", etiqueta: (<><CalendarClock className="size-4" aria-hidden /> Evento</>) },
          { valor: "tarea", etiqueta: (<><ListTodo className="size-4" aria-hidden /> Tarea</>) },
        ]}
      />

      <form key={modo} action={modo === "evento" ? enviarEvento : enviarTarea} onSubmit={validar} noValidate className="grid gap-4">
        <input type="hidden" name="volver" value={volver} />
        <input type="hidden" name="responsable_id" value={responsable} />

        <Campo id="titulo" etiqueta="Título" error={errores.titulo}>
          <Input
            id="titulo"
            name="titulo"
            maxLength={200}
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            autoFocus
            placeholder={modo === "evento" ? "Ej.: Visita a la barbería" : "Ej.: Preparar la propuesta"}
            aria-invalid={!!errores.titulo || undefined}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="fecha" etiqueta={modo === "evento" ? "Fecha" : "Fecha límite"} error={errores.fecha}>
            <DatePicker
              id="fecha"
              name={modo === "evento" ? "fecha_inicio" : "fecha_limite"}
              valor={dia}
              onCambio={setDia}
              opcional={modo === "tarea"}
              placeholder={modo === "tarea" ? "Sin fecha" : "Elegir fecha"}
              invalido={!!errores.fecha}
            />
          </Campo>
          {modo === "evento" ? (
            <div className="grid gap-2">
              <Label>Horario</Label>
              <label className="flex h-11 items-center gap-2 text-sm font-bold text-ergon-navy md:h-10">
                <Switch name="todo_el_dia" checked={todoElDia} onCheckedChange={setTodoElDia} /> Todo el día
              </label>
            </div>
          ) : null}
        </div>

        {modo === "evento" ? (
          <>
            <input type="hidden" name="fecha_fin" value={dia} />
            {todoElDia ? null : (
              <div className="grid grid-cols-2 gap-4">
                <Campo id="hora_inicio" etiqueta="Hora de inicio">
                  <HoraSelect
                    id="hora_inicio"
                    name="hora_inicio"
                    valor={horaInicio}
                    onCambio={(v) => {
                      setHoraInicio(v);
                      if (horaFin <= v) setHoraFin(sumarMin(v, 60));
                    }}
                  />
                </Campo>
                <Campo id="hora_fin" etiqueta="Hora de fin" error={errores.hora_fin}>
                  <HoraSelect id="hora_fin" name="hora_fin" valor={horaFin} onCambio={setHoraFin} invalido={!!errores.hora_fin} />
                </Campo>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="lugar" etiqueta="Lugar">
                <Input id="lugar" name="lugar" maxLength={200} placeholder="Opcional" />
              </Campo>
              <Campo id="enlace" etiqueta="Link">
                <Input id="enlace" name="enlace" type="url" inputMode="url" placeholder="https://…" />
              </Campo>
            </div>
          </>
        ) : (
          <>
            <input type="hidden" name="prioridad" value={prioridad} />
            <div className="grid gap-2">
              <Label>Prioridad</Label>
              <Segmentos
                etiqueta="Prioridad"
                activo={prioridad}
                onCambio={setPrioridad}
                opciones={PRIORIDADES.map((p) => ({ valor: p, etiqueta: NOMBRE_PRIORIDAD[p] }))}
                className="self-start"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Campo id="proyecto_id" etiqueta="Proyecto">
                <NativeSelect id="proyecto_id" name="proyecto_id" defaultValue={proyectoId ?? ""}>
                  <option value="">Sin proyecto</option>
                  {proyectos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </NativeSelect>
              </Campo>
              <Campo id="estado" etiqueta="Estado">
                <NativeSelect id="estado" name="estado" defaultValue={estadoInicial}>
                  {ESTADOS_TAREA.map((e) => (
                    <option key={e} value={e}>
                      {NOMBRE_ESTADO[e]}
                    </option>
                  ))}
                </NativeSelect>
              </Campo>
            </div>
          </>
        )}

        <div className="grid gap-2">
          <Label>Responsable</Label>
          <Segmentos
            etiqueta="Responsable"
            activo={responsable}
            onCambio={setResponsable}
            className="self-start"
            opciones={[
              ...catalogos.perfiles.map((p) => ({
                valor: p.usuario_id,
                etiqueta: p.usuario_id === catalogos.yoId ? `${p.nombre.split(" ")[0]} (yo)` : p.nombre.split(" ")[0],
              })),
              { valor: "", etiqueta: "Ambos" },
            ]}
          />
        </div>

        <Campo id={modo === "evento" ? "notas" : "descripcion"} etiqueta={modo === "evento" ? "Notas" : "Descripción"}>
          <Textarea id={modo === "evento" ? "notas" : "descripcion"} name={modo === "evento" ? "notas" : "descripcion"} rows={3} />
        </Campo>

        <ErrorForm mensaje={errorServidor} />
        <div className="flex gap-2">
          <Button type="submit" loading={enviando}>
            {enviando ? "Guardando…" : modo === "evento" ? "Crear evento" : "Crear tarea"}
          </Button>
          <Button asChild variant="ghost">
            <Link href={volver}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
