import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerServicios } from "@/lib/catalogo";
import { Titulo } from "@/components/panel/titulo";
import { Button } from "@/components/ui/button";
import { ExploradorCatalogo } from "@/components/catalogo/explorador";

export const metadata: Metadata = { title: "Catálogo" };

export default async function CatalogoPage() {
  await obtenerUsuario();
  const servicios = await obtenerServicios();
  return (
    <>
      <Titulo
        accion={
          <Button asChild>
            <Link href="/catalogo/nuevo">
              <Plus /> Servicio
            </Link>
          </Button>
        }
      >
        Catálogo
      </Titulo>
      <ExploradorCatalogo servicios={servicios} />
    </>
  );
}
