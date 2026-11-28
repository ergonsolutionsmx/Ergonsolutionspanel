/**
 * Scripts que corren en <head> antes de pintar (sin parpadeo).
 * Van en un módulo normal (no "use client") para que el layout del servidor los pueda usar como texto.
 */

/** Pone .dark según la preferencia guardada. La página pública de propuestas (/p/...) siempre va en claro. */
export const SCRIPT_TEMA = `(function(){try{if(location.pathname.indexOf('/p/')===0)return;var t=localStorage.getItem('tema')||'sistema';var d=t==='oscuro'||(t==='sistema'&&matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d)}catch(e){}})()`;

/** Aplica el vidrio guardado en Ajustes → Apariencia. */
export const SCRIPT_VIDRIO = `(function(){try{var v=JSON.parse(localStorage.getItem('vidrio')||'null');if(!v)return;var s=document.documentElement.style;if(v.blur!=null)s.setProperty('--vidrio-blur',v.blur+'px');if(v.opacidad!=null)s.setProperty('--vidrio-opacidad',v.opacidad);if(v.saturacion!=null)s.setProperty('--vidrio-saturacion',v.saturacion);if(v.borde!=null)s.setProperty('--vidrio-borde',v.borde)}catch(e){}})()`;
