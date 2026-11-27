import { LogOut } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { cerrarSesion } from "@/app/(auth)/acciones";
import { cn } from "@/lib/utils";

export function Iniciales({ nombre, color, className }: { nombre: string; color: string; className?: string }) {
  const letras = nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white", className)}
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {letras}
    </span>
  );
}

/** Pie del menú lateral: quién está dentro y botón de salir (el nombre aparece al abrir el menú). */
export async function UsuarioMenuLateral() {
  const usuario = await obtenerUsuario();
  return (
    <div className="flex items-center gap-3 pl-1">
      <Iniciales nombre={usuario.nombre} color={usuario.color} className="ring-2 ring-white/15" />
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-white opacity-0 transition-opacity duration-200 group-data-[abierto=true]/menu:opacity-100">
        {usuario.nombre}
      </span>
      <form action={cerrarSesion} className="opacity-0 transition-opacity duration-200 group-data-[abierto=true]/menu:opacity-100">
        <button
          type="submit"
          className="rounded-full p-2 text-sidebar-foreground/75 outline-none hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-sidebar-accent"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

/** Encabezado: iniciales del usuario. */
export async function UsuarioEncabezado() {
  const usuario = await obtenerUsuario();
  return (
    <span title={usuario.nombre}>
      <Iniciales nombre={usuario.nombre} color={usuario.color} />
    </span>
  );
}
