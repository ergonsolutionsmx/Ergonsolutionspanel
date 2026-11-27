# Ergon Solutions · panel interno

Panel de Jorge y Antonio para el día a día de Ergon Solutions: Inicio, Agenda,
Bandeja, Catálogo de servicios, Propuestas (PDF y link de 30 días), Proyectos y
tareas, Lanzador de demos y Ajustes.

Next.js 16 (App Router) + Tailwind 4 + Supabase (Postgres, Auth, Realtime, pg_cron).
Se publica en Vercel.

## Correr en local

```bash
cp .env.example .env.local   # y llénalo (ver abajo)
npm install
npm run dev
```

Abrir http://localhost:3000

## Variables de entorno

| Variable | Para qué | ¿Secreta? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL del proyecto de Supabase | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Llave pública (publishable) | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor: formulario del sitio y WhatsApp | **Sí** |
| `APP_URL` | URL pública del panel, sin `/` final | No |
| `INBOX_FORM_SECRET` | Clave compartida con el formulario del sitio | **Sí** |
| `INBOX_FORM_ORIGINS` | Dominios que pueden mandar el formulario desde el navegador | No |
| `ADMIN_JORGE_EMAIL`, `ADMIN_ANTONIO_EMAIL` | Para `npm run crear-usuarios` | No |
| `GMAIL_*`, `WHATSAPP_*` | Cuando se conecten correo y WhatsApp | **Sí** |

Nunca subir `.env.local` al repositorio.

## Cuentas

No hay registro público. Para dar acceso:

1. Agregar el correo a la lista de permitidos (SQL en Supabase):
   `insert into privado.correos_permitidos (correo, nombre, color) values ('correo@…', 'Nombre', '#2563EB');`
2. Crear la cuenta en Supabase → Authentication → Users → Add user (con *Auto Confirm*),
   o con `npm run crear-usuarios`.

El perfil se crea solo. Una cuenta sin perfil no entra al panel aunque exista en Auth.

## Publicar en Vercel

1. En Vercel → equipo → **Add New → Project → Import Git Repository**: instalar la
   integración de GitHub para la organización `ergonsolutionsmx` (solo el repo
   `Ergonsolutionspanel`) e importarlo.
2. Cargar las variables de entorno de la tabla de arriba. `APP_URL` = la URL que dé Vercel.
3. Desplegar. Revisar la vista previa antes de pasar a producción.
4. En Supabase → Authentication → URL Configuration: poner la URL de Vercel como
   *Site URL* y agregar `https://<url>/auth/confirm` a *Redirect URLs*.

Las migraciones de `supabase/migrations` ya están aplicadas en el proyecto de Supabase.

## Canales de la bandeja

- **Avisos internos:** funcionando.
- **Formulario del sitio:** ver `docs/formulario-sitio.md`.
- **Correo (Gmail):** adaptador en `lib/inbox/adapters/correo.ts`; falta OAuth y tarea programada.
- **WhatsApp:** webhook en `/api/inbox/whatsapp`; se registra en Meta cuando haya cuenta y número.

## Tareas programadas (pg_cron, hora de CDMX)

| Hora | Qué hace |
|---|---|
| 8:00 | Aviso "Vence hoy" por cada tarea que vence ese día |
| 8:05 | Marca propuestas vencidas y avisa |
| 8:10 | Aviso en la bandeja por cada tarea vencida (una vez) |

## Estructura

```
app/(auth)        login, recuperar, nueva-contrasena
app/(panel)       inicio, agenda, bandeja, catalogo, propuestas, proyectos, demos, ajustes
app/p/[token]     propuesta pública (sin sesión)
app/api/inbox     formulario y whatsapp
lib/              acceso a datos por módulo, fechas (CDMX), pdf, inbox/adapters
components/       UI por módulo y componentes base (components/ui)
supabase/         migraciones y carga inicial del catálogo (seed/catalogo.json)
docs/             guía para conectar el formulario del sitio
```

## Marca y diseño

Colores en `app/globals.css` (`--ergon-*` y roles), tipografía en `app/layout.tsx`
(Lato, POR CONFIRMAR) y logos en `public/brand/`. La luz de marca (`.luz-marca`) es
solo decorativa.

## Por confirmar

- Tipografía final (Lato vs Archivo + IBM Plex Sans).
- Dominio y subdominio del panel.
- Precios y tiempos de las variantes del catálogo.
- Si los precios de las propuestas incluyen IVA.
- Contenido de los servicios 05, 06, 20, 21, 22, 23 y 24 (sin documento Definición).
- URL de la Demo.
- CRM (siguiente etapa): agregar `cliente_id` a propuestas y mensajes.
