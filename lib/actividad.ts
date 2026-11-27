import "server-only";
import { ACCIONES_BITACORA, RUTA_REGISTRO, TABLAS_BITACORA, nombreRegistro, type Registro } from "@/lib/bitacora";
import { fechaCorta, horaBonita, hoyISO, partesCDMX, sumarDias } from "@/lib/fechas";

export type EntradaActividad = {
  id: string;
  quien: { nombre: string; color: string } | null;
  texto: string;
  modulo: string;
  hora: string;
  href?: string;
};

export type DiaActividad = { dia: string; entradas: EntradaActividad[] };

/** Convierte registros de la bitácora en una línea de tiempo agrupada por día (Hoy, Ayer, fecha). */
export function agruparActividad(registros: Registro[], perfiles: { usuario_id: string; nombre: string; color: string }[]): DiaActividad[] {
  const perfil = new Map(perfiles.map((p) => [p.usuario_id, p]));
  const hoy = hoyISO();
  const ayer = sumarDias(hoy, -1);
  const grupos = new Map<string, EntradaActividad[]>();
  for (const r of registros) {
    const { fecha, hora } = partesCDMX(r.creado_en);
    const etiqueta = fecha === hoy ? "Hoy" : fecha === ayer ? "Ayer" : fechaCorta(fecha, hoy);
    const p = r.usuario_id ? perfil.get(r.usuario_id) : undefined;
    const accion = ACCIONES_BITACORA[r.accion] ?? r.accion;
    const modulo = TABLAS_BITACORA[r.tabla ?? ""] ?? (r.tabla ?? "Sistema");
    const nombre = nombreRegistro(r);
    const texto = r.tabla === "cuenta" ? accion : `${accion} ${modulo.toLowerCase()}${nombre ? ` "${nombre}"` : ""}`;
    const ruta = r.tabla && r.registro_id && r.accion !== "delete" ? RUTA_REGISTRO[r.tabla]?.(r.registro_id) : undefined;
    const lista = grupos.get(etiqueta) ?? [];
    lista.push({
      id: r.id,
      quien: p ? { nombre: p.nombre, color: p.color } : null,
      texto,
      modulo,
      hora: horaBonita(hora),
      href: ruta,
    });
    grupos.set(etiqueta, lista);
  }
  return [...grupos].map(([dia, entradas]) => ({ dia, entradas }));
}
