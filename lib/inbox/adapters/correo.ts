import "server-only";
import type { MensajeEntrante } from "@/lib/inbox/tipos";
import { variablesFaltantes, type AdaptadorCanal } from "./tipos";

/**
 * Correo (Gmail API con OAuth). LISTO, SIN CONECTAR.
 * Flujo previsto (POR CONFIRMAR al conectar):
 *  1. En Google Cloud: proyecto, Gmail API activa y cliente OAuth (GMAIL_CLIENT_ID / GMAIL_CLIENT_SECRET).
 *  2. Autorizar una vez la cuenta y guardar el refresh token (GMAIL_REFRESH_TOKEN).
 *  3. Una tarea programada llama a sincronizarCorreo() cada pocos minutos:
 *     users.messages.list (q = "in:inbox newer_than:2d") → users.messages.get → normalizarGmail().
 *  El id de Gmail se usa como externo_id, así que repetir la sincronización no duplica.
 */
const VARIABLES = ["GMAIL_CLIENT_ID", "GMAIL_CLIENT_SECRET", "GMAIL_REFRESH_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"];
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

type MensajeGmail = {
  id: string;
  threadId?: string;
  snippet?: string;
  internalDate?: string;
  payload?: {
    headers?: { name: string; value: string }[];
    mimeType?: string;
    body?: { data?: string };
    parts?: { mimeType?: string; body?: { data?: string } }[];
  };
};

function base64url(datos?: string) {
  return datos ? Buffer.from(datos.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8") : "";
}

/** "Lupita <lupita@correo.mx>" → { nombre, correo } */
function separarRemitente(de: string) {
  const m = de.match(/^\s*"?([^"<]*)"?\s*<([^>]+)>/);
  return m ? { nombre: m[1].trim() || null, correo: m[2].trim() } : { nombre: null, correo: de.trim() };
}

export function normalizarGmail(m: MensajeGmail): MensajeEntrante {
  const h = (n: string) => m.payload?.headers?.find((x) => x.name.toLowerCase() === n.toLowerCase())?.value ?? "";
  const { nombre, correo } = separarRemitente(h("From"));
  const texto =
    m.payload?.parts?.find((p) => p.mimeType === "text/plain")?.body?.data ??
    (m.payload?.mimeType === "text/plain" ? m.payload?.body?.data : undefined);
  return {
    canal: "correo",
    externoId: m.id,
    nombre,
    contacto: correo,
    asunto: h("Subject") || null,
    cuerpo: (base64url(texto) || m.snippet || "").slice(0, 20000),
    crudos: { threadId: m.threadId ?? null, fecha: h("Date") || null },
  };
}

async function tokenDeAcceso() {
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GMAIL_CLIENT_ID!,
      client_secret: process.env.GMAIL_CLIENT_SECRET!,
      refresh_token: process.env.GMAIL_REFRESH_TOKEN!,
      grant_type: "refresh_token",
    }),
  });
  if (!r.ok) throw new Error(`Gmail OAuth: ${r.status}`);
  return ((await r.json()) as { access_token: string }).access_token;
}

/** Trae los correos recientes de la bandeja de Gmail. No se usa hasta conectar la cuenta. */
export async function sincronizarCorreo(): Promise<MensajeEntrante[]> {
  if (variablesFaltantes(VARIABLES).length) return [];
  const token = await tokenDeAcceso();
  const auth = { headers: { Authorization: `Bearer ${token}` } };
  const lista = await fetch(`${API}/messages?q=${encodeURIComponent("in:inbox newer_than:2d")}&maxResults=50`, auth);
  if (!lista.ok) throw new Error(`Gmail list: ${lista.status}`);
  const ids = (((await lista.json()) as { messages?: { id: string }[] }).messages ?? []).map((m) => m.id);
  const mensajes: MensajeEntrante[] = [];
  for (const id of ids) {
    const r = await fetch(`${API}/messages/${id}?format=full`, auth);
    if (r.ok) mensajes.push(normalizarGmail((await r.json()) as MensajeGmail));
  }
  return mensajes;
}

export const adaptadorCorreo: AdaptadorCanal = {
  canal: "correo",
  normalizar: (m) => [normalizarGmail(m as MensajeGmail)],
  estado: () => {
    const faltan = variablesFaltantes(VARIABLES);
    return {
      configurado: faltan.length === 0,
      faltan,
      descripcion: faltan.length
        ? "Listo, sin conectar. Se configura después con la cuenta de Gmail (OAuth)."
        : "Variables puestas. Falta programar la sincronización.",
    };
  },
};
