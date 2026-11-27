"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

// El cliente de Supabase (con Realtime) se carga después de la primera pintura: así la página abre más rápido.
let clientePromesa: Promise<SupabaseClient> | null = null;
const cliente = () => (clientePromesa ??= import("@/lib/supabase/client").then((m) => m.crearClienteNavegador() as SupabaseClient));

export type Notificacion = {
  id: string;
  tipo: string;
  titulo: string;
  cuerpo: string | null;
  link: string | null;
  leida: boolean;
  creado_en: string;
};

type Valor = {
  notificaciones: Notificacion[];
  noLeidas: number;
  cargando: boolean;
  marcarLeida: (id: string) => Promise<void>;
  marcarTodas: () => Promise<void>;
  /** Descarta (borra) una notificación. */
  descartar: (id: string) => Promise<void>;
  /** Descarta todas. */
  limpiar: () => Promise<void>;
  /** Ids que acaban de llegar (para animarlas). */
  nuevas: Set<string>;
  /** Sube cada vez que llega algo nuevo (para mover la campanita). */
  pulso: number;
};

const Contexto = createContext<Valor | null>(null);
const LIMITE = 30;
const COLUMNAS = "id, tipo, titulo, cuerpo, link, leida, creado_en";

/**
 * Carga las notificaciones del usuario y escucha las nuevas en tiempo real
 * (Supabase Realtime). La RLS garantiza que cada quien solo ve las suyas.
 */
export function ProveedorNotificaciones({ children }: { children: React.ReactNode }) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const [pulso, setPulso] = useState(0);
  const conocidas = useRef<Set<string> | null>(null);

  const recargar = useCallback(async () => {
    const supabase = await cliente();
    const [lista, conteo] = await Promise.all([
      supabase.from("notificaciones").select(COLUMNAS).order("creado_en", { ascending: false }).limit(LIMITE),
      supabase.from("notificaciones").select("id", { count: "exact", head: true }).eq("leida", false),
    ]);
    if (lista.data) {
      const previas = conocidas.current;
      const llegaron = previas ? lista.data.filter((n) => !previas.has(n.id) && !n.leida).map((n) => n.id) : [];
      conocidas.current = new Set(lista.data.map((n) => n.id));
      if (llegaron.length) {
        setNuevas(new Set(llegaron));
        setPulso((p) => p + 1);
      }
      setNotificaciones(lista.data);
    }
    if (typeof conteo.count === "number") setNoLeidas(conteo.count);
    setCargando(false);
  }, []);

  useEffect(() => {
    let canal: ReturnType<SupabaseClient["channel"]> | null = null;
    let activo = true;
    let supabase: SupabaseClient | null = null;

    // Esperar a que el navegador esté libre antes de conectar (no compite con la carga de la página).
    const arrancar = async () => {
      supabase = await cliente();
      if (!activo) return;
      await recargar();
      const { data } = await supabase.auth.getClaims();
      const usuarioId = data?.claims?.sub;
      if (!activo || !usuarioId) return;

      // El token de la sesión debe llegar a Realtime para que aplique la RLS.
      const { data: sesion } = await supabase.auth.getSession();
      if (sesion.session) supabase.realtime.setAuth(sesion.session.access_token);

      canal = supabase
        .channel(`notificaciones:${usuarioId}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "notificaciones", filter: `usuario_id=eq.${usuarioId}` },
          () => void recargar(),
        )
        .subscribe();
    };
    const idle = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    const t = idle ? idle(() => void arrancar(), { timeout: 2500 }) : window.setTimeout(() => void arrancar(), 800);

    // Al volver a la pestaña (o al celular), refrescar por si Realtime se durmió.
    const alVolver = () => document.visibilityState === "visible" && void recargar();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      activo = false;
      document.removeEventListener("visibilitychange", alVolver);
      if (!idle) window.clearTimeout(t);
      if (canal && supabase) void supabase.removeChannel(canal);
    };
  }, [recargar]);

  const marcarLeida = useCallback(
    async (id: string) => {
      const actual = notificaciones.find((n) => n.id === id);
      if (!actual || actual.leida) return;
      setNotificaciones((ns) => ns.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      setNoLeidas((c) => Math.max(0, c - 1));
      await (await cliente()).from("notificaciones").update({ leida: true }).eq("id", id);
    },
    [notificaciones],
  );

  const marcarTodas = useCallback(async () => {
    setNotificaciones((ns) => ns.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
    await (await cliente()).from("notificaciones").update({ leida: true }).eq("leida", false);
  }, []);

  const descartar = useCallback(
    async (id: string) => {
      const actual = notificaciones.find((n) => n.id === id);
      setNotificaciones((ns) => ns.filter((n) => n.id !== id));
      if (actual && !actual.leida) setNoLeidas((c) => Math.max(0, c - 1));
      await (await cliente()).from("notificaciones").delete().eq("id", id);
    },
    [notificaciones],
  );

  const limpiar = useCallback(async () => {
    const ids = notificaciones.map((n) => n.id);
    setNotificaciones([]);
    setNoLeidas(0);
    const supabase = await cliente();
    if (ids.length) await supabase.from("notificaciones").delete().in("id", ids);
    await supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
  }, [notificaciones]);

  const valor = useMemo(
    () => ({ notificaciones, noLeidas, cargando, marcarLeida, marcarTodas, descartar, limpiar, nuevas, pulso }),
    [notificaciones, noLeidas, cargando, marcarLeida, marcarTodas, descartar, limpiar, nuevas, pulso],
  );

  return <Contexto value={valor}>{children}</Contexto>;
}

export function useNotificaciones() {
  const valor = use(Contexto);
  if (!valor) throw new Error("useNotificaciones debe usarse dentro de ProveedorNotificaciones");
  return valor;
}
