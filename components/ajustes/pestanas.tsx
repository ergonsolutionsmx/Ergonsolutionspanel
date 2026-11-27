"use client";

import { Bell, History, MonitorPlay, PlugZap, ShieldCheck, UserRound } from "lucide-react";
import { SettingsTabs, type PestanaAjustes } from "@/components/ui/settings-tabs";

const PESTANAS: PestanaAjustes[] = [
  { href: "/ajustes", nombre: "Perfil", icono: UserRound, exacta: true },
  { href: "/ajustes/seguridad", nombre: "Seguridad", icono: ShieldCheck },
  { href: "/ajustes/notificaciones", nombre: "Notificaciones", icono: Bell },
  { href: "/ajustes/canales", nombre: "Integraciones", icono: PlugZap },
  { href: "/ajustes/demos", nombre: "Demos", icono: MonitorPlay },
  { href: "/ajustes/bitacora", nombre: "Bitácora", icono: History },
];

export function PestanasAjustes() {
  return <SettingsTabs pestanas={PESTANAS} />;
}
