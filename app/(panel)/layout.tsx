import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MenuLateral } from "@/components/panel/menu-lateral";
import { BarraInferior } from "@/components/panel/barra-inferior";
import { UsuarioEncabezado, UsuarioMenuLateral } from "@/components/panel/usuario";
import { Cargando } from "@/components/panel/cargando";
import { ProveedorNotificaciones } from "@/components/notificaciones/contexto";
import { Campanita } from "@/components/notificaciones/campanita";

export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <ProveedorNotificaciones>
      <div className="min-h-dvh md:flex md:gap-4 md:p-4">
        {/* El menú lee la ruta actual (para resaltar la sección): va dentro de Suspense. */}
        <Suspense fallback={<aside className="vidrio sticky top-4 hidden h-[calc(100dvh-2rem)] w-60 shrink-0 rounded-[1.5rem] md:block" />}>
          <MenuLateral
            pie={
              <Suspense fallback={<div className="h-8" />}>
                <UsuarioMenuLateral />
              </Suspense>
            }
          />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Encabezado solo en celular: barra de vidrio flotante */}
          <div className="sticky top-0 z-30 px-3 pt-[calc(0.5rem+env(safe-area-inset-top))] md:hidden">
            <header className="vidrio-solido flex h-14 items-center justify-between rounded-2xl pl-3 pr-2">
              <Link href="/inicio" aria-label="Inicio">
                <Image src="/brand/logo-horizontal-claro.png" alt="Ergon Solutions" width={240} height={56} priority className="h-auto w-28" />
              </Link>
              <div className="flex items-center gap-1.5">
                <Campanita className="rounded-full text-ergon-navy hover:bg-white/70" />
                <Suspense fallback={<div className="size-8" />}>
                  <UsuarioEncabezado />
                </Suspense>
              </div>
            </header>
          </div>

          {/* Contenedor principal de vidrio (en computadora); en celular el contenido va directo sobre el fondo. */}
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
