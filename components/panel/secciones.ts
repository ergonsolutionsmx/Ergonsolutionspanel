import {
  BookOpen,
  CalendarDays,
  FileText,
  FolderKanban,
  House,
  Inbox,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type Seccion = {
  href: string;
  nombre: string;
  icono: LucideIcon;
  /** Aparece directo en la barra inferior del celular (el resto va en "Más"). */
  enBarra?: boolean;
  /** Nombre corto para la barra inferior. */
  corto?: string;
};

export const SECCIONES: Seccion[] = [
  { href: "/inicio", nombre: "Inicio", icono: House, enBarra: true },
  { href: "/agenda", nombre: "Agenda", icono: CalendarDays, enBarra: true },
  { href: "/bandeja", nombre: "Bandeja", icono: Inbox, enBarra: true },
  { href: "/catalogo", nombre: "Catálogo", icono: BookOpen },
  { href: "/propuestas", nombre: "Propuestas", icono: FileText },
  { href: "/finanzas", nombre: "Finanzas", icono: Wallet },
  { href: "/proyectos", nombre: "Proyectos y tareas", corto: "Tareas", icono: FolderKanban, enBarra: true },
  { href: "/ajustes", nombre: "Ajustes", icono: Settings },
];

export function estaActiva(ruta: string, href: string) {
  return ruta === href || ruta.startsWith(`${href}/`);
}
