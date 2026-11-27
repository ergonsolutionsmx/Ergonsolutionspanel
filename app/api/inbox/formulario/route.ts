import { NextResponse } from "next/server";
import { claveValida, validarFormulario } from "@/lib/inbox/adapters/formulario";
import { ingresarMensaje, ipDe } from "@/lib/inbox/ingresar";

/**
 * Recibe mensajes del formulario del sitio web.
 * - Clave compartida: encabezado "x-inbox-key" (o campo "clave") = INBOX_FORM_SECRET.
 * - Campo trampa "sitio_web": si viene lleno, se rechaza.
 * - Límite: 5 envíos por IP cada 10 minutos.
 * - El mismo mensaje no se guarda dos veces.
 * Ver docs/formulario-sitio.md.
 */

const MAX_BYTES = 20_000;

function origenesPermitidos() {
  return (process.env.INBOX_FORM_ORIGINS ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function cors(request: Request): Record<string, string> {
  const origen = request.headers.get("origin");
  if (!origen || !origenesPermitidos().includes(origen)) return {};
  return {
    "Access-Control-Allow-Origin": origen,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, x-inbox-key",
    Vary: "Origin",
  };
}

function responder(request: Request, status: number, cuerpo: Record<string, unknown>) {
  return NextResponse.json(cuerpo, { status, headers: { ...cors(request), "Cache-Control": "no-store" } });
}

export function OPTIONS(request: Request) {
  return new Response(null, { status: 204, headers: cors(request) });
}

async function leerDatos(request: Request): Promise<Record<string, unknown> | null> {
  const largo = Number(request.headers.get("content-length") ?? 0);
  if (largo > MAX_BYTES) return null;
  const tipo = request.headers.get("content-type") ?? "";
  try {
    if (tipo.includes("application/json")) {
      const texto = await request.text();
      if (texto.length > MAX_BYTES) return null;
      const json = JSON.parse(texto);
      return json && typeof json === "object" && !Array.isArray(json) ? json : null;
    }
    if (tipo.includes("application/x-www-form-urlencoded") || tipo.includes("multipart/form-data")) {
      const fd = await request.formData();
      return Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string"));
    }
  } catch {
    return null;
  }
  return null;
}

export async function POST(request: Request) {
  if (!process.env.INBOX_FORM_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return responder(request, 503, { ok: false, error: "El formulario no está configurado." });
  }

  const datos = await leerDatos(request);
  if (!datos) return responder(request, 400, { ok: false, error: "Datos no válidos." });

  const clave = request.headers.get("x-inbox-key") ?? (typeof datos.clave === "string" ? datos.clave : null);
  if (!claveValida(clave)) return responder(request, 401, { ok: false, error: "Clave no válida." });

  const v = validarFormulario(datos);
  if (!v.ok) {
    return responder(request, 400, { ok: false, error: v.motivo === "trampa" ? "Rechazado." : (v.detalle ?? "Datos no válidos.") });
  }

  const resultado = await ingresarMensaje(v.mensaje, ipDe(request));
  switch (resultado) {
    case "creado":
      return responder(request, 201, { ok: true });
    case "duplicado":
      return responder(request, 200, { ok: true, duplicado: true });
    case "limite":
      return responder(request, 429, { ok: false, error: "Demasiados envíos. Intenta más tarde." });
    default:
      return responder(request, 500, { ok: false, error: "No se pudo guardar." });
  }
}
