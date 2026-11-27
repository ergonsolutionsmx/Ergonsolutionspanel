"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

const BuscadorDialogo = dynamic(() => import("./buscador-dialogo"), { ssr: false });

/** Buscador global (Ctrl/Cmd + K): ir a una sección, a un servicio o crear algo. */
export function Buscador() {
  const [abierto, setAbierto] = useState(false);
  const [usado, setUsado] = useState(false);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setUsado(true);
        setAbierto((v) => !v);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setUsado(true);
          setAbierto(true);
        }}
        className="flex h-10 w-72 items-center gap-2 rounded-full border border-white/70 bg-white/60 px-4 text-sm text-muted-foreground shadow-sm outline-none hover:bg-white focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Search className="size-4" aria-hidden />
        <span className="flex-1 text-left">Buscar o crear…</span>
        <kbd className="rounded-md border bg-card px-1.5 py-0.5 text-[11px] font-bold text-muted-foreground">Ctrl K</kbd>
      </button>
      {usado ? <BuscadorDialogo abierto={abierto} setAbierto={setAbierto} /> : null}
    </>
  );
}
