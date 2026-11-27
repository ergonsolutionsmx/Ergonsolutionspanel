import type { Metadata } from "next";
import { Database, Triangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CanalesBandeja } from "@/components/bandeja/canales";
import { SeccionAjustes } from "@/components/ajustes/seccion";

export const metadata: Metadata = { title: "Integraciones" };

const SERVICIOS = [
  { nombre: "Supabase", texto: "Base de datos, cuentas y avisos en tiempo real.", icono: Database, color: "bg-exito/10 text-exito" },
  { nombre: "Vercel", texto: "Donde se publica el panel.", icono: Triangle, color: "bg-ergon-navy/[0.07] text-ergon-navy" },
];

export default function AjustesIntegracionesPage() {
  return (
    <div className="grid gap-4">
      <SeccionAjustes titulo="Canales de la bandeja" descripcion="Gmail, formulario del sitio y WhatsApp.">
        <CanalesBandeja />
      </SeccionAjustes>
      <SeccionAjustes titulo="Servicios del panel">
        <ul className="divide-y">
          {SERVICIOS.map((s) => (
            <li key={s.nombre} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className={`grid size-9 shrink-0 place-items-center rounded-full ${s.color}`}>
                <s.icono className="size-4" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ergon-navy">{s.nombre}</span>
                <span className="block text-sm text-muted-foreground">{s.texto}</span>
              </span>
              <Badge variant="aceptada">Conectado</Badge>
            </li>
          ))}
        </ul>
      </SeccionAjustes>
    </div>
  );
}
