import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Settings } from "lucide-react";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerServicios } from "@/lib/catalogo";
import { obtenerDemos } from "@/lib/demos";
import { Titulo } from "@/components/panel/titulo";
import { Button } from "@/components/ui/button";
import { Segmentos } from "@/components/ui/segmentos";
import { ExploradorCatalogo } from "@/components/catalogo/explorador";
import { BentoDemos } from "@/components/demos/bento";

export const metadata: Metadata = { title: "Catálogo" };

/** Catálogo de servicios y, en otra pestaña, la demo que se le enseña al cliente. */
export default async function CatalogoPage({ searchParams }: PageProps<"/catalogo">) {
  await obtenerUsuario();
  const vista = (await searchParams).vista === "demos" ? "demos" : "servicios";
  return (
    <>
      <Titulo
        accion={
          vista === "servicios" ? (
            <Button asChild>
              <Link href="/catalogo/nuevo">
                <Plus /> Servicio
              </Link>
            </Button>
          ) : (
            <Button asChild variant="outline">
              <Link href="/ajustes/demos">
                <Settings /> Editar demo
              </Link>
            </Button>
          )
        }
      >
        Catálogo
      </Titulo>
      <Segmentos
        etiqueta="Secciones del catálogo"
        activo={vista}
        className="mb-5"
        opciones={[
          { valor: "servicios", etiqueta: "Servicios", href: "/catalogo" },
          { valor: "demos", etiqueta: "Demo", href: "/catalogo?vista=demos" },
        ]}
      />
      {vista === "servicios" ? <Servicios /> : <Demos />}
    </>
  );
}

async function Servicios() {
  const servicios = await obtenerServicios();
  return <ExploradorCatalogo servicios={servicios} />;
}

async function Demos() {
  const demos = await obtenerDemos({ soloActivas: true });
  const url = demos.find((d) => d.url)?.url ?? null;
  return (
    <>
      <BentoDemos url={url} />
      {url ? null : (
        <p className="mt-4 text-sm text-muted-foreground">
          La demo todavía no tiene link. Cuando esté lista, agrégalo en{" "}
          <Link href="/ajustes/demos" className="font-bold text-primary hover:underline">
            Ajustes → Demos
          </Link>
          .
        </p>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Cada demo tiene su propio acceso: este panel no comparte la sesión.</p>
    </>
  );
}
