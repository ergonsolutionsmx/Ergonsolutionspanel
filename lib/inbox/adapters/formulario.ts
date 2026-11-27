import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";
import type { MensajeEntrante } from "@/lib/inbox/tipos";
import { variablesFaltantes, type AdaptadorCanal } from "./tipos";

/** Campo trampa: los humanos no lo ven; si viene lleno, es un bot. */
export const CAMPO_TRAMPA = "sitio_web";

const LIMITES = { nombre: 120, contacto: 160, asunto: 200, mensaje: 5000 };

export type ResultadoValidacion =
  | { ok: true; mensaje: MensajeEntrante }
  | { ok: false; motivo: "trampa" | "invalido"; detalle?: string };

export function claveValida(recibida: string | null | undefined) {
  const esperada = process.env.INBOX_FORM_SECRET;
  if (!esperada || !recibida) return false;
  const a = createHash("sha256").update(recibida).digest();
  const b = createHash("sha256").update(esperada).digest();
  return timingSafeEqual(a, b);
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valida los datos del formulario del sitio y los convierte a mensaje. */
export function validarFormulario(datos: Record<string, unknown>): ResultadoValidacion {
  if (texto(datos[CAMPO_TRAMPA], 500)) return { ok: false, motivo: "trampa" };

  const nombre = texto(datos.nombre, LIMITES.nombre);
  const correo = texto(datos.correo, LIMITES.contacto);
  const telefono = texto(datos.telefono, LIMITES.contacto);
  const asunto = texto(datos.asunto, LIMITES.asunto);
  const mensaje = texto(datos.mensaje, LIMITES.mensaje);

  if (!nombre) return { ok: false, motivo: "invalido", detalle: "Falta el nombre." };
  if (!mensaje) return { ok: false, motivo: "invalido", detalle: "Falta el mensaje." };
  if (!correo && !telefono) return { ok: false, motivo: "invalido", detalle: "Falta un correo o teléfono." };
  if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) return { ok: false, motivo: "invalido", detalle: "Correo no válido." };
  if (telefono && telefono.replace(/\D/g, "").length < 8) return { ok: false, motivo: "invalido", detalle: "Teléfono no válido." };

  const contacto = correo || telefono;
  // Sin id del sitio: el mismo contenido no se guarda dos veces (doble clic, reintentos).
  const idSitio = texto(datos.id, 100);
  const externoId = idSitio || createHash("sha256").update(`${nombre}|${contacto}|${mensaje}`).digest("hex").slice(0, 40);

  return {
    ok: true,
    mensaje: {
      canal: "formulario",
      externoId,
      nombre,
      contacto,
      asunto: asunto || null,
      cuerpo: mensaje,
      crudos: {
        correo: correo || null,
        telefono: telefono || null,
        pagina: texto(datos.pagina, 300) || null,
      },
    },
  };
}

export const adaptadorFormulario: AdaptadorCanal = {
  canal: "formulario",
  estado: () => {
    const faltan = variablesFaltantes(["INBOX_FORM_SECRET", "SUPABASE_SERVICE_ROLE_KEY"]);
    return {
      configurado: faltan.length === 0,
      faltan,
      descripcion: faltan.length
        ? "Listo, sin conectar. Falta configurar variables de entorno."
        : "Listo para recibir. Falta conectar el formulario del sitio (ver docs/formulario-sitio.md).",
    };
  },
};
