import type { Metadata } from "next";
import { LogoGoogleCalendar, LogoGoogleDrive, LogoSupabase, LogoVercel } from "@/components/logos/marcas";
import { Badge } from "@/components/ui/badge";
import { CanalesBandeja } from "@/components/bandeja/canales";
import { SeccionAjustes } from "@/components/ajustes/seccion";

export const metadata: Metadata = { title: "Integraciones" };

const SERVICIOS = [
  { nombre: "Supabase", texto: "Base de datos, cuentas y avisos en tiempo real.", Logo: LogoSupabase, estado: "Conectado" },
  { nombre: "Vercel", texto: "Donde se publica el panel.", Logo: LogoVercel, estado: "Conectado" },
  { nombre: "Google Drive", texto: "Carpetas de cada servicio del catálogo.", Logo: LogoGoogleDrive, estado: "Conectado" },
  { nombre: "Google Calendar", texto: "Sincronizar la agenda con Google.", Logo: LogoGoogleCalendar, estado: "Próximamente" },
];

export default function AjustesIntegracionesPage() {
  return (
    <div className="grid gap-4">
      <SeccionAjustes titulo="Canales de la bandeja" descripcion="Gmail, formulario del sitio y WhatsApp.">
        <CanalesBandeja />
      </SeccionAjustes>
      <SeccionAjustes titulo="Servicios del panel" descripcion="Herramientas que usa el panel por dentro.">
        <ul className="divide-y">
          {SERVICIOS.map((s) => (
            <li key={s.nombre} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white ring-1 ring-ergon-navy/10">
                <s.Logo aria-hidden titulo="" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-ergon-navy">{s.nombre}</span>
                <span className="block text-sm text-muted-foreground">{s.texto}</span>
              </span>
              <Badge variant={s.estado === "Conectado" ? "aceptada" : "pendiente"}>{s.estado}</Badge>
            </li>
          ))}
        </ul>
      </SeccionAjustes>
    </div>
  );
}
