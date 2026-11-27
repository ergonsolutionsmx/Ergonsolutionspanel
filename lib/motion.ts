import type { Transition, Variants } from "motion/react";

/** Valores de animación compartidos por todo el panel. */
export const DURACION = { rapida: 0.15, media: 0.25, lenta: 0.4 } as const;
export const SUAVE = [0.16, 1, 0.3, 1] as const;

/** Resorte suave (el del kanban): para acomodos y elementos que se mueven. */
export const gentleSpring: Transition = { type: "spring", stiffness: 380, damping: 32, mass: 0.8 };

export const fadeUp: Variants = {
  oculto: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: DURACION.lenta, ease: SUAVE } },
};

export const scaleIn: Variants = {
  oculto: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1, transition: { duration: DURACION.media, ease: SUAVE } },
};

export const stagger = (cada = 0.05, inicio = 0): Variants => ({
  oculto: {},
  visible: { transition: { staggerChildren: cada, delayChildren: inicio } },
});

/** Tarjeta que se levanta un poco al pasar el mouse. */
export const levantar = { y: -2, transition: { duration: DURACION.rapida } };
/** Botón que se encoge al tocarlo. */
export const encoger = { scale: 0.97 };
