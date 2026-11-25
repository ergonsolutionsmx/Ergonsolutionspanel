# Ergon Solutions · panel interno

Panel de Jorge y Antonio para el día a día de Ergon Solutions (ver `PRD`).
Next.js 16 (App Router) + Tailwind 4 + Supabase. Se publica en Vercel.

## Correr en local

```bash
cp .env.example .env.local   # y llénalo
npm install
npm run dev
```

## Cuentas

No hay registro público. Hay dos formas de dar acceso:

1. **Script** (necesita `SUPABASE_SERVICE_ROLE_KEY` en `.env.local`):
   `npm run crear-usuarios`
2. **Panel de Supabase** → Authentication → Users → *Add user* con el correo de Jorge o Antonio.
   Si el correo está en `privado.correos_permitidos`, el perfil se crea solo.

Cualquier cuenta sin perfil no entra al panel aunque exista en Auth.

## Estructura

```
app/(auth)        login, recuperar, nueva-contrasena
app/(panel)       inicio, agenda, bandeja, catalogo, propuestas, proyectos, demos, ajustes
app/auth          confirm (enlace de recuperación), salir
lib/supabase      clientes: navegador, servidor (RLS), admin (service role), proxy
lib/auth.ts       obtenerUsuario(): sesión + perfil (llamarlo en cada página)
proxy.ts          refresca sesión y manda a /login sin sesión
supabase/migrations  SQL aplicado en Supabase, en orden
scripts/          crear-usuarios.ts
```

## Marca

Colores en `app/globals.css` (`--ergon-*`). Tipografía en `app/layout.tsx`
(Lato, `// POR CONFIRMAR`). Logos en `public/brand/`.
