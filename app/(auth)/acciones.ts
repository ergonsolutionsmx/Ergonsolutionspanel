"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/server";
import { rutaSegura } from "@/lib/auth";

export type EstadoFormulario = { error?: string; ok?: string; correo?: string } | undefined;

export async function iniciarSesion(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const correo = String(formData.get("correo") ?? "").trim();
  const contrasena = String(formData.get("contrasena") ?? "");
  if (!correo || !contrasena) return { error: "Escribe tu correo y contraseña.", correo };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.signInWithPassword({ email: correo, password: contrasena });
  if (error) return { error: "Correo o contraseña incorrectos.", correo };

  redirect(rutaSegura(formData.get("siguiente")));
}

async function urlBase() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export async function pedirRecuperacion(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const correo = String(formData.get("correo") ?? "").trim();
  if (!correo) return { error: "Escribe tu correo." };

  const supabase = await crearClienteServidor();
  await supabase.auth.resetPasswordForEmail(correo, {
    redirectTo: `${await urlBase()}/auth/confirm?siguiente=/nueva-contrasena`,
  });

  // Mismo mensaje exista o no el correo (no revelar qué cuentas existen).
  return { ok: "Si el correo está registrado, te llegará un enlace para cambiar tu contraseña." };
}

export async function guardarNuevaContrasena(_: EstadoFormulario, formData: FormData): Promise<EstadoFormulario> {
  const contrasena = String(formData.get("contrasena") ?? "");
  const confirmar = String(formData.get("confirmar") ?? "");
  if (contrasena.length < 8) return { error: "Mínimo 8 caracteres." };
  if (contrasena !== confirmar) return { error: "Las contraseñas no coinciden." };

  const supabase = await crearClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: contrasena });
  if (error) return { error: "No se pudo guardar. Pide un enlace nuevo." };

  redirect("/inicio");
}

export async function cerrarSesion() {
  const supabase = await crearClienteServidor();
  await supabase.auth.signOut();
  redirect("/login");
}
