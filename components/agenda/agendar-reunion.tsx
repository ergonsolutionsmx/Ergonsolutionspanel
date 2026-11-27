"use client";

import { useState } from "react";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Ventana } from "@/components/ui/ventana";
import dynamic from "next/dynamic";

// El formulario (con el calendario) se carga al abrirlo.
const MeetingScheduler = dynamic(() => import("@/components/ui/meeting-scheduler").then((m) => m.MeetingScheduler), {
  ssr: false,
  loading: () => <div className="esqueleto h-96 rounded-2xl" />,
});
import type { PerfilCorto } from "@/lib/tareas-tipos";

/** Botón "Agendar reunión": abre el formulario en una ventana (o una hoja en celular). */
export function AgendarReunion({
  perfiles,
  yoId,
  fecha,
  abrir = false,
  tituloInicial,
  variante = "outline",
}: {
  perfiles: PerfilCorto[];
  yoId: string;
  fecha: string;
  volver?: string;
  abrir?: boolean;
  tituloInicial?: string;
  variante?: "outline" | "ghost";
}) {
  const [abierta, setAbierta] = useState(abrir);
  return (
    <>
      <Button variant={variante} onClick={() => setAbierta(true)}>
        <Users /> <span className="hidden sm:inline">Agendar reunión</span>
        <span className="sm:hidden">Reunión</span>
      </Button>
      <Ventana abierta={abierta} onCambio={setAbierta} titulo="Agendar reunión" descripcion="Con un cliente o entre ustedes." ancho="sm:max-w-3xl">
        {abierta ? <MeetingScheduler tituloInicial={tituloInicial} perfiles={perfiles} yoId={yoId} fecha={fecha} onListo={() => setAbierta(false)} onCancelar={() => setAbierta(false)} /> : null}
      </Ventana>
    </>
  );
}
