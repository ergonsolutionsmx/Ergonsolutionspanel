/**
 * Crea (o completa) las 2 cuentas del panel: Jorge y Antonio.
 * No hay registro público: esta es la única forma de crear usuarios.
 *
 * Uso:
 *   1. Llena .env.local con NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      ADMIN_JORGE_EMAIL y ADMIN_ANTONIO_EMAIL.
 *   2. npm run crear-usuarios
 *
 * Es idempotente: si la cuenta ya existe, solo se asegura de que tenga perfil.
 * Las cuentas nuevas se crean SIN contraseña conocida; cada quien la define con
 * "Olvidé mi contraseña" en /login (llega un enlace a su correo).
 * Opcional: ADMIN_JORGE_PASSWORD / ADMIN_ANTONIO_PASSWORD para fijarla desde aquí.
 */
import { config } from "dotenv";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const llave = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !llave) {
  console.error("Falta NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const supabase = createClient(url, llave, {
  auth: { persistSession: false, autoRefreshToken: false },
});

type Admin = { nombre: string; correo?: string; contrasena?: string; color: string };

const ADMINS: Admin[] = [
  {
    nombre: "Jorge",
    correo: process.env.ADMIN_JORGE_EMAIL,
    contrasena: process.env.ADMIN_JORGE_PASSWORD,
    color: "#2563EB",
  },
  {
    nombre: "Antonio",
    correo: process.env.ADMIN_ANTONIO_EMAIL,
    contrasena: process.env.ADMIN_ANTONIO_PASSWORD,
    color: "#0EA5E9",
  },
];

async function buscarPorCorreo(correo: string) {
  for (let page = 1; page < 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const u = data.users.find((x) => x.email?.toLowerCase() === correo.toLowerCase());
    if (u) return u;
    if (data.users.length < 200) return null;
  }
  return null;
}

async function main() {
  for (const admin of ADMINS) {
    if (!admin.correo) {
      console.error(`Falta el correo de ${admin.nombre} (ADMIN_${admin.nombre.toUpperCase()}_EMAIL).`);
      process.exitCode = 1;
      continue;
    }

    let usuario = await buscarPorCorreo(admin.correo);

    if (!usuario) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: admin.correo,
        // Si no se da contraseña, se pone una aleatoria que nadie conoce.
        password: admin.contrasena || randomBytes(32).toString("base64url"),
        email_confirm: true,
        user_metadata: { nombre: admin.nombre },
      });
      if (error) throw error;
      usuario = data.user;
      console.log(`✔ Cuenta creada: ${admin.nombre}`);
    } else {
      if (admin.contrasena) {
        const { error } = await supabase.auth.admin.updateUserById(usuario.id, { password: admin.contrasena });
        if (error) throw error;
        console.log(`✔ Contraseña actualizada: ${admin.nombre}`);
      }
      console.log(`• Ya existía: ${admin.nombre}`);
    }

    const { error } = await supabase.from("perfiles").upsert(
      {
        usuario_id: usuario.id,
        nombre: admin.nombre,
        correo: admin.correo,
        color: admin.color,
        creado_por: usuario.id,
      },
      { onConflict: "usuario_id", ignoreDuplicates: true },
    );
    if (error) throw error;
    console.log(`✔ Perfil listo: ${admin.nombre}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
