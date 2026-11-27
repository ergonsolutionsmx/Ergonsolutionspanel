import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type { MensajeEntrante } from "@/lib/inbox/tipos";
import { variablesFaltantes, type AdaptadorCanal } from "./tipos";

/**
 * WhatsApp Business (Meta Cloud API). APAGADO hasta tener cuenta y número.
 * - GET: verificación del webhook (hub.mode / hub.verify_token / hub.challenge).
 * - POST: Meta firma el cuerpo con HMAC-SHA256 usando el App Secret (X-Hub-Signature-256).
 */
const VARIABLES = ["WHATSAPP_VERIFY_TOKEN", "WHATSAPP_APP_SECRET", "SUPABASE_SERVICE_ROLE_KEY"];

export function verificarSuscripcion(params: URLSearchParams): string | null {
  const token = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token) return null;
  if (params.get("hub.mode") !== "subscribe") return null;
  const recibido = params.get("hub.verify_token") ?? "";
  const a = Buffer.from(recibido);
  const b = Buffer.from(token);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return params.get("hub.challenge");
}

export function firmaValida(cuerpoCrudo: string, encabezado: string | null) {
  const secreto = process.env.WHATSAPP_APP_SECRET;
  if (!secreto || !encabezado?.startsWith("sha256=")) return false;
  const esperada = createHmac("sha256", secreto).update(cuerpoCrudo, "utf8").digest("hex");
  const a = Buffer.from(encabezado.slice(7), "hex");
  const b = Buffer.from(esperada, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

type Valor = {
  contacts?: { wa_id?: string; profile?: { name?: string } }[];
  messages?: {
    id: string;
    from: string;
    type: string;
    timestamp?: string;
    text?: { body?: string };
    button?: { text?: string };
    interactive?: { button_reply?: { title?: string }; list_reply?: { title?: string } };
    image?: { caption?: string };
    document?: { filename?: string; caption?: string };
  }[];
};

/** Payload de Meta → mensajes. Ignora avisos de estado (entregado, leído…). */
export function normalizarWhatsApp(payload: unknown): MensajeEntrante[] {
  const entradas = (payload as { entry?: { changes?: { value?: Valor }[] }[] })?.entry ?? [];
  const salida: MensajeEntrante[] = [];
  for (const entrada of entradas) {
    for (const cambio of entrada.changes ?? []) {
      const valor = cambio.value ?? {};
      for (const m of valor.messages ?? []) {
        const contacto = valor.contacts?.find((c) => c.wa_id === m.from) ?? valor.contacts?.[0];
        const cuerpo =
          m.text?.body ??
          m.button?.text ??
          m.interactive?.button_reply?.title ??
          m.interactive?.list_reply?.title ??
          m.image?.caption ??
          m.document?.caption ??
          `[${m.type}]`;
        salida.push({
          canal: "whatsapp",
          externoId: m.id,
          nombre: contacto?.profile?.name ?? null,
          contacto: m.from,
          asunto: null,
          cuerpo,
          crudos: { tipo: m.type, timestamp: m.timestamp ?? null },
        });
      }
    }
  }
  return salida;
}

export const adaptadorWhatsApp: AdaptadorCanal = {
  canal: "whatsapp",
  normalizar: normalizarWhatsApp,
  estado: () => {
    const faltan = variablesFaltantes(VARIABLES);
    return {
      configurado: faltan.length === 0,
      faltan,
      descripcion: faltan.length
        ? "Listo, sin conectar. Se activa cuando tengan cuenta de Meta Business y número."
        : "Variables puestas. Falta registrar el webhook en Meta: /api/inbox/whatsapp",
    };
  },
};
