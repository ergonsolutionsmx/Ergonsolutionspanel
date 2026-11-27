// Bandeja: tipos compartidos (servidor y cliente).

export const CANALES = ["formulario", "correo", "whatsapp", "interno"] as const;
export type Canal = (typeof CANALES)[number];
export const NOMBRE_CANAL: Record<Canal, string> = {
  formulario: "Formulario del sitio",
  correo: "Correo",
  whatsapp: "WhatsApp",
  interno: "Avisos internos",
};
export const NOMBRE_CANAL_CORTO: Record<Canal, string> = {
  formulario: "Formulario",
  correo: "Correo",
  whatsapp: "WhatsApp",
  interno: "Avisos",
};

export const ESTADOS_MENSAJE = ["nuevo", "leido", "respondido", "archivado"] as const;
export type EstadoMensaje = (typeof ESTADOS_MENSAJE)[number];
export const NOMBRE_ESTADO_MENSAJE: Record<EstadoMensaje, string> = {
  nuevo: "Nuevo",
  leido: "Leído",
  respondido: "Respondido",
  archivado: "Archivado",
};

export type Mensaje = {
  id: string;
  canal: Canal;
  remitente_nombre: string | null;
  remitente_contacto: string | null;
  asunto: string | null;
  cuerpo: string;
  recibido_en: string;
  estado: EstadoMensaje;
  asignado_a: string | null;
  externo_id: string | null;
  datos_crudos: Record<string, unknown>;
};

export const COLUMNAS_MENSAJE =
  "id, canal, remitente_nombre, remitente_contacto, asunto, cuerpo, recibido_en, estado, asignado_a, externo_id, datos_crudos";

/** Mensaje normalizado que entrega cualquier adaptador antes de guardarse. */
export type MensajeEntrante = {
  canal: Exclude<Canal, "interno">;
  externoId: string;
  nombre: string | null;
  contacto: string | null;
  asunto: string | null;
  cuerpo: string;
  crudos: Record<string, unknown>;
};

/** Cómo responder: abre el canal (mailto:, wa.me o un link interno). */
export type Respuesta = { tipo: "externo" | "interno"; url: string; etiqueta: string } | null;

/** Detecta si el contacto es correo o teléfono y arma el enlace para responder. */
export function enlaceRespuesta(m: Pick<Mensaje, "canal" | "remitente_contacto" | "asunto" | "datos_crudos">): Respuesta {
  if (m.canal === "interno") {
    const link = typeof m.datos_crudos?.link === "string" ? m.datos_crudos.link : null;
    return link?.startsWith("/") ? { tipo: "interno", url: link, etiqueta: "Abrir" } : null;
  }
  const contacto = (m.remitente_contacto ?? "").trim();
  if (!contacto) return null;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contacto)) {
    const asunto = m.asunto ? `Re: ${m.asunto}` : "Ergon Solutions";
    return { tipo: "externo", url: `mailto:${contacto}?subject=${encodeURIComponent(asunto)}`, etiqueta: "Responder por correo" };
  }
  const digitos = contacto.replace(/\D/g, "");
  if (digitos.length >= 10) {
    // México: 10 dígitos → 52 + número.
    const numero = digitos.length === 10 ? `52${digitos}` : digitos;
    return { tipo: "externo", url: `https://wa.me/${numero}`, etiqueta: "Responder por WhatsApp" };
  }
  return null;
}
