import { LogOut } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { cerrarSesion } from "@/app/(auth)/acciones";

function Iniciales({ nombre, color }: { nombre: string; color: string }) {
  const letras = nombre
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
      style={{ backgroundColor: color }}
      aria-hidden
    >
      {letras}
    </span>
  );
}

/** Pie del menú lateral: quién está dentro y botón de salir. */
export async function UsuarioMenuLateral() {
  const usuario = await obtenerUsuario();
  return (
    <div className="flex items-center gap-3">
      <Iniciales nombre={usuario.nombre} color={usuario.color} />
      <span className="min-w-0 flex-1 truncate text-sm font-bold">{usuario.nombre}</span>
      <form action={cerrarSesion}>
        <button
          type="submit"
          className="rounded-md p-2 text-white/75 hover:bg-white/10 hover:text-white"
          aria-label="Cerrar sesión"
          title="Cerrar sesión"
        >
          <LogOut className="size-4" />
        </button>
      </form>
    </div>
  );
}

/** Encabezado del celular: iniciales del usuario. */
export async function UsuarioEncabezado() {
  const usuario = await obtenerUsuario();
  return <Iniciales nombre={usuario.nombre} color={usuario.color} />;
}
