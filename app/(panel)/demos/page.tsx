import type { Metadata } from "next";
import Link from "next/link";
import { Settings } from "lucide-react";
import { BentoDemos } from "@/components/demos/bento";
import { obtenerUsuario } from "@/lib/auth";
import { obtenerDemos } from "@/lib/demos";
import { Titulo } from "@/components/panel/titulo";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Demos" };

export default async function DemosPage() {
  await obtenerUsuario();
  const demos = await obtenerDemos({ soloActivas: true });
  return (
    <>
      <Titulo
        accion={
          <Button asChild variant="outline">
            <Link href="/ajustes/demos">
              <Settings /> Editar
            </Link>
          </Button>
        }
      >
        Demos
      </Titulo>
      <BentoDemos url={demos.find((d) => d.url)?.url ?? null} />
      {demos.some((d) => d.url) ? null : (
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
