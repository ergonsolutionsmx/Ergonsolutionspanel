import { CargandoContenido } from "@/components/panel/cargando";

/** El título y las pestañas de Ajustes ya están en el layout: solo se carga el contenido. */
export default function Loading() {
  return <CargandoContenido />;
}
