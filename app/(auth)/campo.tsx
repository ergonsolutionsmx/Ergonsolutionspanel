"use client";

import { useState } from "react";
import { Eye, EyeOff, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Campo de las pantallas de acceso (sobre fondo oscuro): icono, label solo para lector y ver/ocultar contraseña. */
export function Campo({
  etiqueta,
  icono: Icono,
  type,
  className,
  ...props
}: React.ComponentProps<"input"> & { etiqueta: string; name: string; icono?: LucideIcon }) {
  const [ver, setVer] = useState(false);
  const esContrasena = type === "password";
  return (
    <div className="group/campo relative">
      <label htmlFor={props.name} className="sr-only">
        {etiqueta}
      </label>
      {Icono ? (
        <Icono
          className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-white/40 transition-colors group-focus-within/campo:text-white"
          aria-hidden
        />
      ) : null}
      <input
        id={props.name}
        required
        type={esContrasena && ver ? "text" : type}
        placeholder={etiqueta}
        className={cn(
          "h-12 w-full rounded-xl border border-white/10 bg-white/[0.06] text-base text-white outline-none transition-[border-color,background-color,box-shadow] placeholder:text-white/40 focus:border-ergon-sky/60 focus:bg-white/[0.09] focus:ring-4 focus:ring-ergon-sky/15 md:text-sm",
          Icono ? "pl-10" : "pl-4",
          esContrasena ? "pr-11" : "pr-4",
          className,
        )}
        {...props}
      />
      {esContrasena ? (
        <button
          type="button"
          onClick={() => setVer((v) => !v)}
          aria-label={ver ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={ver}
          className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-white/50 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-ergon-sky"
        >
          {ver ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
        </button>
      ) : null}
    </div>
  );
}

export function Aviso({ estado }: { estado?: { error?: string; ok?: string } }) {
  if (estado?.error)
    return (
      <p role="alert" className="rounded-xl border border-red-400/30 bg-red-500/15 px-3 py-2.5 text-sm text-red-100">
        {estado.error}
      </p>
    );
  if (estado?.ok)
    return (
      <p role="status" className="rounded-xl border border-ergon-sky/30 bg-ergon-sky/10 px-3 py-2.5 text-sm text-sky-50">
        {estado.ok}
      </p>
    );
  return null;
}

/** Encabezado de las pantallas de acceso. */
export function EncabezadoAcceso({ titulo, texto }: { titulo: string; texto?: string }) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-xl font-black text-white">{titulo}</h1>
      {texto ? <p className="mt-1 text-sm text-white/60">{texto}</p> : null}
    </div>
  );
}
