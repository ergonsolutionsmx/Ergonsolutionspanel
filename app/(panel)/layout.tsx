import { Logo } from "@/components/brand/logo";
import Link from "next/link";
import { Suspense } from "react";
import { MenuLateral } from "@/components/panel/menu-lateral";
import { BarraInferior } from "@/components/panel/barra-inferior";
import { Buscador } from "@/components/panel/buscador";
import { UsuarioEncabezado, UsuarioMenuLateral } from "@/components/panel/usuario";
import { Cargando } from "@/components/panel/cargando";
import { ProveedorNotificaciones } from "@/components/notificaciones/contexto";
import { Campanita } from "@/components/notificaciones/campanita";

export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <ProveedorNotificaciones>
      <div className="min-h-dvh md:flex">
        {/* El menú lee la ruta actual (para resaltar la sección): va dentro de Suspense. */}
        <Suspense fallback={<div className="sticky top-0 hidden h-dvh w-[72px] shrink-0 bg-sidebar md:block" />}>
          <MenuLateral
            pie={
              <Suspense fallback={<div className="h-8" />}>
                <UsuarioMenuLateral />
              </Suspense>
            }
          />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col md:p-4 md:pl-5">
          {/* Celular: barra superior flotante con el símbolo, campanita y usuario */}
          <div className="sticky top-0 z-30 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] md:hidden">
            <header className="vidrio-solido flex h-14 items-center justify-between rounded-2xl pl-2.5 pr-2">
              <Link href="/inicio" aria-label="Ergon Solutions · Inicio" className="flex items-center gap-2">
                <Logo variante="app" prioridad className="size-8 rounded-lg" />
                <span className="text-sm font-black tracking-tight text-ergon-navy">Ergon Solutions</span>
              </Link>
              <div className="flex items-center gap-1.5">
                <Campanita className="rounded-full text-ergon-navy hover:bg-white/70" />
                <Suspense fallback={<div className="size-8" />}>
                  <UsuarioEncabezado />
                </Suspense>
              </div>
            </header>
          </div>

          {/* Computadora: barra superior de vidrio con buscador, campanita y usuario */}
          <header className="vidrio mx-auto mb-4 hidden h-16 w-full max-w-6xl items-center justify-between gap-4 rounded-[1.25rem] px-4 md:flex">
            <Buscador />
            <div className="flex items-center gap-2">
              <Campanita className="rounded-full text-ergon-navy hover:bg-white/70" />
              <Suspense fallback={<div className="size-8" />}>
                <UsuarioEncabezado />
              </Suspense>
            </div>
          </header>

          {/* Contenedor principal de vidrio (computadora); en celular el contenido va directo sobre el fondo. */}
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-5 md:vidrio md:rounded-[1.75rem] md:px-8 md:pb-10 md:pt-8">
            <Suspense fallback={<Cargando />}>
              <div className="revelar">{children}</div>
            </Suspense>
          </main>
        </div>

        <Suspense fallback={<div className="vidrio fixed inset-x-3 bottom-3 h-16 rounded-[1.375rem] md:hidden" />}>
          <BarraInferior />
        </Suspense>
      </div>
    </ProveedorNotificaciones>
  );
}
