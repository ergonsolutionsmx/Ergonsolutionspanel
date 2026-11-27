import { NextResponse } from "next/server";
import { firmaValida, normalizarWhatsApp, verificarSuscripcion } from "@/lib/inbox/adapters/whatsapp";
import { ingresarMensaje } from "@/lib/inbox/ingresar";

/**
 * Webhook de WhatsApp Business (Meta Cloud API). APAGADO hasta tener cuenta y número:
 * sin WHATSAPP_VERIFY_TOKEN y WHATSAPP_APP_SECRET responde 503.
 */
function apagado() {
  return !process.env.WHATSAPP_VERIFY_TOKEN || !process.env.WHATSAPP_APP_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY;
}

/** Verificación del webhook al registrarlo en Meta. */
export function GET(request: Request) {
  if (apagado()) return NextResponse.json({ ok: false, error: "WhatsApp no está conectado." }, { status: 503 });
  const reto = verificarSuscripcion(new URL(request.url).searchParams);
  if (reto === null) return new Response("Prohibido", { status: 403 });
  return new Response(reto, { status: 200, headers: { "Content-Type": "text/plain" } });
}

export async function POST(request: Request) {
  if (apagado()) return NextResponse.json({ ok: false, error: "WhatsApp no está conectado." }, { status: 503 });
  const crudo = await request.text();
  if (crudo.length > 1_000_000) return new Response("Demasiado grande", { status: 413 });
  if (!firmaValida(crudo, request.headers.get("x-hub-signature-256"))) {
    return new Response("Firma no válida", { status: 401 });
  }
  let payload: unknown;
  try {
    payload = JSON.parse(crudo);
  } catch {
    return new Response("JSON no válido", { status: 400 });
  }
  for (const m of normalizarWhatsApp(payload)) await ingresarMensaje(m);
  // Meta reintenta si no recibe 200.
  return NextResponse.json({ ok: true });
}
