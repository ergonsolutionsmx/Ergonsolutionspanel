"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, FolderKanban, MessageSquare, Pencil, Send, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { fechaRelativa } from "@/lib/fechas";
import { haceCuanto } from "@/lib/tiempo";
import { estaVencida, NOMBRE_ESTADO, type Catalogos, type Tarea } from "@/lib/tareas-tipos";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BotonEliminar } from "@/components/ui/boton-eliminar";
import { toast } from "@/components/avisos/toast";
import {
  agregarChecklist,
  alternarChecklist,
  borrarChecklist,
  borrarComentario,
  comentar,
  detalleTarea,
  eliminarTarea,
  type Comentario,
  type ElementoChecklist,
} from "@/app/(panel)/proyectos/acciones";
import { Avatar, EtiquetaPrioridad } from "./etiquetas";
import { hrefTarea } from "./tarjeta-tarea";

type Datos = { tarea: Tarea; checklist: ElementoChecklist[]; comentarios: Comentario[] };

/** Detalle de una tarea en una hoja lateral: descripción, datos, checklist, comentarios y Editar / Borrar. */
export function DetalleTarea({
  tareaId,
  catalogos,
  volver,
  onCerrar,
}: {
  tareaId: string | null;
  catalogos: Catalogos;
  volver: string;
  onCerrar: () => void;
}) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargadoDe, setCargadoDe] = useState<string | null>(null);
  const [nuevo, setNuevo] = useState("");
  const [comentario, setComentario] = useState("");
  const [enviando, startTransition] = useTransition();

  // Al abrir otra tarea, se limpia lo anterior (ajuste durante el render) y se pide el detalle.
  if (tareaId !== cargadoDe) {
    setCargadoDe(tareaId);
    setDatos(null);
  }
  useEffect(() => {
    if (!tareaId) return;
    let vivo = true;
    void detalleTarea(tareaId).then((d) => vivo && d && setDatos(d));
    return () => {
      vivo = false;
    };
  }, [tareaId]);

  const t = datos?.tarea;
  const proyecto = catalogos.proyectos.find((p) => p.id === t?.proyecto_id);
  const responsable = catalogos.perfiles.find((p) => p.usuario_id === t?.responsable_id);
  const hechos = datos?.checklist.filter((c) => c.hecho).length ?? 0;

  const agregar = () =>
    startTransition(async () => {
      if (!tareaId || !nuevo.trim()) return;
      const el = await agregarChecklist(tareaId, nuevo);
      if (el) {
        setDatos((d) => (d ? { ...d, checklist: [...d.checklist, el] } : d));
        setNuevo("");
      } else toast.error("No se pudo agregar");
    });

  const enviarComentario = () =>
    startTransition(async () => {
      if (!tareaId || !comentario.trim()) return;
      const c = await comentar(tareaId, comentario);
      if (c) {
        setDatos((d) => (d ? { ...d, comentarios: [...d.comentarios, c] } : d));
        setComentario("");
      } else toast.error("No se pudo comentar");
    });

  return (
    <Sheet open={!!tareaId} onOpenChange={(v) => !v && onCerrar()}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto border-0 p-0 sm:max-w-lg">
        <SheetTitle className="sr-only">{t?.titulo ?? "Tarea"}</SheetTitle>
        <SheetDescription className="sr-only">Detalle de la tarea</SheetDescription>
        {!t ? (
          <div className="space-y-4 p-6 pt-12">
            <Skeleton className="h-7 w-3/4" />
            <Skeleton className="h-20 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <div className="flex flex-col">
            <header className="border-b p-5 pt-12">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant={t.estado === "hecha" ? "aceptada" : t.estado === "en_curso" ? "en-progreso" : t.estado === "en_revision" ? "pendiente" : "default"}>
                  {NOMBRE_ESTADO[t.estado]}
                </Badge>
                <EtiquetaPrioridad prioridad={t.prioridad} />
                {estaVencida(t, catalogos.hoy) ? <Badge variant="vencida">Vencida</Badge> : null}
              </div>
              <h2 className={cn("text-xl font-black text-ergon-navy", t.estado === "hecha" && "line-through decoration-2")}>{t.titulo}</h2>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs font-bold text-muted-foreground">Responsable</dt>
                  <dd className="mt-0.5 flex items-center gap-2 font-bold">
                    <Avatar perfil={responsable} /> {responsable?.nombre ?? "Los dos"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-muted-foreground">Fecha límite</dt>
                  <dd className={cn("mt-0.5 flex items-center gap-1.5 font-bold", estaVencida(t, catalogos.hoy) && "text-error")}>
                    <CalendarDays className="size-4" aria-hidden /> {t.fecha_limite ? fechaRelativa(t.fecha_limite, catalogos.hoy) : "Sin fecha"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs font-bold text-muted-foreground">Proyecto</dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 font-bold">
                    <FolderKanban className="size-4" aria-hidden />
                    {proyecto ? (
                      <Link href={`/proyectos/${proyecto.id}`} className="hover:underline">
                        {proyecto.nombre}
                      </Link>
                    ) : (
                      "Sin proyecto"
                    )}
                  </dd>
                </div>
              </dl>
            </header>

            {t.descripcion ? <p className="whitespace-pre-line border-b p-5 text-sm leading-relaxed">{t.descripcion}</p> : null}

            {/* Checklist */}
            <section className="border-b p-5" aria-label="Checklist">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="font-black text-ergon-navy">Checklist</h3>
                {datos.checklist.length ? (
                  <span className="text-xs font-bold text-muted-foreground">
                    {hechos}/{datos.checklist.length}
                  </span>
                ) : null}
              </div>
              {datos.checklist.length ? (
                <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-exito"
                    animate={{ width: `${(hechos / datos.checklist.length) * 100}%` }}
                    transition={{ type: "spring", stiffness: 200, damping: 26 }}
                  />
                </div>
              ) : null}
              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {datos.checklist.map((c) => (
                    <motion.li
                      key={c.id}
                      layout
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-muted"
                    >
                      <Checkbox
                        checked={c.hecho}
                        aria-label={c.texto}
                        onCheckedChange={(v) => {
                          const hecho = v === true;
                          setDatos((d) => (d ? { ...d, checklist: d.checklist.map((x) => (x.id === c.id ? { ...x, hecho } : x)) } : d));
                          void alternarChecklist(c.id, hecho);
                        }}
                      />
                      <span className="flex-1 text-sm">
                        <span className={cn("tachado", c.hecho && "tachado-activo text-muted-foreground")}>{c.texto}</span>
                      </span>
                      <button
                        type="button"
                        aria-label={`Quitar: ${c.texto}`}
                        onClick={() => {
                          setDatos((d) => (d ? { ...d, checklist: d.checklist.filter((x) => x.id !== c.id) } : d));
                          void borrarChecklist(c.id);
                        }}
                        className="rounded-full p-1 text-muted-foreground hover:bg-card hover:text-error md:opacity-0 md:group-hover:opacity-100"
                      >
                        <X className="size-3.5" aria-hidden />
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
              <form
                className="mt-2 flex gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  agregar();
                }}
              >
                <Input value={nuevo} onChange={(e) => setNuevo(e.target.value)} placeholder="Agregar un paso…" maxLength={300} aria-label="Nuevo paso" />
                <Button type="submit" variant="outline" disabled={!nuevo.trim() || enviando}>
                  Agregar
                </Button>
              </form>
            </section>

            {/* Comentarios */}
            <section className="border-b p-5" aria-label="Comentarios">
              <h3 className="mb-3 flex items-center gap-2 font-black text-ergon-navy">
                <MessageSquare className="size-4" aria-hidden /> Comentarios
              </h3>
              <ul className="space-y-3">
                <AnimatePresence initial={false}>
                  {datos.comentarios.map((c) => {
                    const autor = catalogos.perfiles.find((p) => p.usuario_id === c.usuario_id);
                    const mio = c.usuario_id === catalogos.yoId;
                    return (
                      <motion.li key={c.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="group flex gap-2.5">
                        <Avatar perfil={autor} className="size-7" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs">
                            <span className="font-bold">{autor?.nombre.split(" ")[0] ?? "Alguien"}</span>{" "}
                            <span className="text-muted-foreground">{haceCuanto(c.creado_en)}</span>
                          </p>
                          <p className="mt-0.5 whitespace-pre-line rounded-2xl rounded-tl-md bg-muted px-3 py-2 text-sm">{c.texto}</p>
                        </div>
                        {mio ? (
                          <button
                            type="button"
                            aria-label="Borrar comentario"
                            onClick={() => {
                              setDatos((d) => (d ? { ...d, comentarios: d.comentarios.filter((x) => x.id !== c.id) } : d));
                              void borrarComentario(c.id);
                            }}
                            className="self-start rounded-full p-1 text-muted-foreground hover:text-error md:opacity-0 md:group-hover:opacity-100"
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </button>
                        ) : null}
                      </motion.li>
                    );
                  })}
                </AnimatePresence>
              </ul>
              <form
                className="mt-3 flex items-end gap-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  enviarComentario();
                }}
              >
                <Textarea value={comentario} onChange={(e) => setComentario(e.target.value)} placeholder="Escribe un comentario…" rows={2} aria-label="Comentario" />
                <Button type="submit" size="icon" aria-label="Enviar comentario" disabled={!comentario.trim() || enviando}>
                  <Send />
                </Button>
              </form>
            </section>

            <footer className="flex gap-2 p-5">
              <Button asChild variant="outline" className="flex-1">
                <Link href={hrefTarea(t.id, volver)}>
                  <Pencil /> Editar
                </Link>
              </Button>
              <BotonEliminar accion={eliminarTarea.bind(null, t.id, volver)} pregunta="¿Borrar esta tarea?" texto="Borrar" detalle={`“${t.titulo}” se borrará para los dos.`} />
            </footer>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
