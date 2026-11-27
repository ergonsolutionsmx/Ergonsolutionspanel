"use client";

import { useSyncExternalStore } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { Alert, AlertContent, AlertDescription, AlertTitle } from "@/components/ui/alert";

type Tipo = "success" | "error" | "info";
type Aviso = { id: string; tipo: Tipo; titulo: string; texto?: string };

let avisos: Aviso[] = [];
const oyentes = new Set<() => void>();
const emitir = () => oyentes.forEach((f) => f());

function quitar(id: string) {
  avisos = avisos.filter((a) => a.id !== id);
  emitir();
}

function mostrar(tipo: Tipo, titulo: string, texto?: string) {
  const id = crypto.randomUUID();
  avisos = [...avisos.slice(-2), { id, tipo, titulo, texto }];
  emitir();
  window.setTimeout(() => quitar(id), tipo === "error" ? 4500 : 3500);
}

/** Avisos rápidos: toast.success("Guardado"), toast.error("No se pudo guardar"). */
export const toast = {
  success: (titulo: string, texto?: string) => mostrar("success", titulo, texto),
  error: (titulo: string, texto?: string) => mostrar("error", titulo, texto),
  info: (titulo: string, texto?: string) => mostrar("info", titulo, texto),
};

const ICONO = { success: CircleCheck, error: CircleAlert, info: Info };

/** Abajo al centro en celular (encima de la barra) y arriba a la derecha en computadora. */
export function Toaster() {
  const lista = useSyncExternalStore(
    (f) => {
      oyentes.add(f);
      return () => oyentes.delete(f);
    },
    () => avisos,
    () => avisos,
  );

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-3 bottom-[calc(6rem+env(safe-area-inset-bottom))] z-[100] flex flex-col items-center gap-2 md:inset-x-auto md:bottom-auto md:right-6 md:top-6 md:items-end"
    >
      <AnimatePresence initial={false}>
        {lista.map((a) => {
          const Icono = ICONO[a.tipo];
          return (
            <m.div
              key={a.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 420, damping: 32 }}
              className="pointer-events-auto w-full max-w-[400px]"
            >
              <Alert
                isNotification
                variant={a.tipo}
                layout="complex"
                icon={<Icono className="size-5" aria-hidden />}
                action={
                  <button
                    type="button"
                    onClick={() => quitar(a.id)}
                    aria-label="Cerrar aviso"
                    className="-m-1 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                }
              >
                <AlertContent>
                  <AlertTitle className="text-foreground">{a.titulo}</AlertTitle>
                  {a.texto ? <AlertDescription>{a.texto}</AlertDescription> : null}
                </AlertContent>
              </Alert>
            </m.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
