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
      <div className="min-h-dvh md:flex">
        {/* El menú lee la ruta actual (para resaltar la sección): va dentro de Suspense. */}
        <Suspense fallback={<aside className="sticky top-0 hidden h-dvh w-60 shrink-0 bg-ergon-navy md:block" />}>
          <MenuLateral
            pie={
              <Suspense fallback={<div className="h-8" />}>
                <UsuarioMenuLateral />
              </Suspense>
            }
          />
        </Suspense>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Encabezado solo en celular */}
          <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 pt-[env(safe-area-inset-top)] md:hidden">
            <Link href="/inicio" aria-label="Inicio">
              <Image src="/brand/isotipo.png" alt="Ergon Solutions" width={32} height={32} priority />
            </Link>
            <div className="flex items-center gap-2">
              <Campanita className="text-ergon-navy hover:bg-accent" />
              <Suspense fallback={<div className="size-8" />}>
                <UsuarioEncabezado />
              </Suspense>
            </div>
          </header>

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
            <Suspense fallback={<Cargando />}>{children}</Suspense>
          </main>
        </div>

        <Suspense fallback={<div className="fixed inset-x-0 bottom-0 h-16 border-t bg-card md:hidden" />}>
          <BarraInferior />
        </Suspense>
      </div>
    </ProveedorNotificaciones>
  );
}
