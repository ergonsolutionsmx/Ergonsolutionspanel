"use client";

import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { crearClienteNavegador } from "@/lib/supabase/client";

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
  const supabase = useMemo(() => crearClienteNavegador(), []);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [nuevas, setNuevas] = useState<Set<string>>(new Set());
  const [pulso, setPulso] = useState(0);
  const conocidas = useRef<Set<string> | null>(null);

  const recargar = useCallback(async () => {
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
  }, [supabase]);

  useEffect(() => {
    let canal: ReturnType<typeof supabase.channel> | null = null;
    let activo = true;

    (async () => {
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
    })();

    // Al volver a la pestaña (o al celular), refrescar por si Realtime se durmió.
    const alVolver = () => document.visibilityState === "visible" && void recargar();
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      activo = false;
      document.removeEventListener("visibilitychange", alVolver);
      if (canal) void supabase.removeChannel(canal);
    };
  }, [supabase, recargar]);

  const marcarLeida = useCallback(
    async (id: string) => {
      const actual = notificaciones.find((n) => n.id === id);
      if (!actual || actual.leida) return;
      setNotificaciones((ns) => ns.map((n) => (n.id === id ? { ...n, leida: true } : n)));
      setNoLeidas((c) => Math.max(0, c - 1));
      await supabase.from("notificaciones").update({ leida: true }).eq("id", id);
    },
    [supabase, notificaciones],
  );

  const marcarTodas = useCallback(async () => {
    setNotificaciones((ns) => ns.map((n) => ({ ...n, leida: true })));
    setNoLeidas(0);
    await supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
  }, [supabase]);

  const descartar = useCallback(
    async (id: string) => {
      const actual = notificaciones.find((n) => n.id === id);
      setNotificaciones((ns) => ns.filter((n) => n.id !== id));
      if (actual && !actual.leida) setNoLeidas((c) => Math.max(0, c - 1));
      await supabase.from("notificaciones").delete().eq("id", id);
    },
    [supabase, notificaciones],
  );

  const limpiar = useCallback(async () => {
    const ids = notificaciones.map((n) => n.id);
    setNotificaciones([]);
    setNoLeidas(0);
    if (ids.length) await supabase.from("notificaciones").delete().in("id", ids);
    await supabase.from("notificaciones").update({ leida: true }).eq("leida", false);
  }, [supabase, notificaciones]);

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
