import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink, MonitorPlay, Settings } from "lucide-react";
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
      {demos.length === 0 ? (
        <p className="rounded-lg border border-white/70 bg-card p-8 text-center text-sm text-muted-foreground">
          Sin demos. Agrégalas en Ajustes → Demos.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {demos.map((d) => (
            <li key={d.id} className="flex flex-col gap-3 rounded-lg border border-white/70 bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <span className="flex size-10 items-center justify-center rounded-lg bg-ergon-navy text-ergon-sky">
                  <MonitorPlay className="size-5" aria-hidden />
                </span>
                <h2 className="font-black text-ergon-navy">{d.nombre}</h2>
              </div>
              {d.descripcion ? <p className="text-sm text-muted-foreground">{d.descripcion}</p> : null}
              <div className="mt-auto pt-2">
                {d.url ? (
                  <Button asChild className="w-full">
                    <a href={d.url} target="_blank" rel="noopener noreferrer">
                      Abrir <ExternalLink className="size-4" aria-hidden />
                    </a>
                  </Button>
                ) : (
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/ajustes/demos">Falta la URL · configurar</Link>
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Cada demo tiene su propio acceso: este panel no comparte la sesión.</p>
    </>
  );
}
