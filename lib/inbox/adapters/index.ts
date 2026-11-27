import "server-only";
import type { Canal } from "@/lib/inbox/tipos";
import type { AdaptadorCanal } from "./tipos";
import { adaptadorCorreo } from "./correo";
import { adaptadorFormulario } from "./formulario";
import { adaptadorInterno } from "./interno";
import { adaptadorWhatsApp } from "./whatsapp";

export const ADAPTADORES: Record<Canal, AdaptadorCanal> = {
  interno: adaptadorInterno,
  formulario: adaptadorFormulario,
  correo: adaptadorCorreo,
  whatsapp: adaptadorWhatsApp,
};
