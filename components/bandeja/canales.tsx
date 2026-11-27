import "server-only";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ADAPTADORES } from "@/lib/inbox/adapters";
import { CANALES, NOMBRE_CANAL, type Canal } from "@/lib/inbox/tipos";
import { haceCuanto } from "@/lib/tiempo";
import { Badge } from "@/components/ui/badge";
import { IconoCanal } from "./icono-canal";
import { BotonPrueba } from "./boton-prueba";

/** Ajustes → Canales: estado de cada canal y mensaje de prueba. */
export async function CanalesBandeja() {
  const supabase = await crearClienteServidor();
  const { data } = await supabase.from("canales_config").select("canal, activo, estado_conexion, ultima_sincronizacion");
  const config = new Map((data ?? []).map((c) => [c.canal as Canal, c]));

  return (
    <ul className="divide-y">
      {CANALES.map((canal) => {
        const c = config.get(canal);
        const e = ADAPTADORES[canal].estado();
        const activo = canal === "interno" || (c?.activo && e.configurado);
        return (
          <li key={canal} className="flex flex-wrap items-start gap-3 py-4 first:pt-0 last:pb-0">
            <IconoCanal canal={canal} />
            <div className="min-w-[14rem] flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-bold">{NOMBRE_CANAL[canal]}</span>
                {activo ? <Badge variant="verde">Activo</Badge> : <Badge variant="gris">No conectado</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{e.descripcion}</p>
              {e.faltan.length ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Variables por configurar: {e.faltan.map((v) => <code key={v} className="mr-1 rounded bg-muted px-1">{v}</code>)}
                </p>
              ) : null}
              {c?.ultima_sincronizacion ? (
                <p className="mt-1 text-xs text-muted-foreground">Último mensaje recibido {haceCuanto(c.ultima_sincronizacion)}</p>
              ) : null}
            </div>
            <BotonPrueba canal={canal} />
          </li>
        );
      })}
    </ul>
  );
}
