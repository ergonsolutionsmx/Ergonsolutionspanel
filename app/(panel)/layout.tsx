import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { MenuLateral } from "@/components/panel/menu-lateral";
import { BarraInferior } from "@/components/panel/barra-inferior";
import { UsuarioEncabezado, UsuarioMenuLateral } from "@/components/panel/usuario";
import { Cargando } from "@/components/panel/cargando";

export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-dvh md:flex">
      <MenuLateral
        pie={
          <Suspense fallback={<div className="h-8" />}>
            <UsuarioMenuLateral />
          </Suspense>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Encabezado solo en celular */}
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-card px-4 pt-[env(safe-area-inset-top)] md:hidden">
          <Link href="/inicio" aria-label="Inicio">
            <Image src="/brand/isotipo.png" alt="Ergon Solutions" width={32} height={32} priority />
          </Link>
          <Suspense fallback={<div className="size-8" />}>
            <UsuarioEncabezado />
          </Suspense>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 md:px-8 md:pb-10 md:pt-8">
          <Suspense fallback={<Cargando />}>{children}</Suspense>
        </main>
      </div>

      <BarraInferior />
    </div>
  );
}
