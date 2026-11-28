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
| 8:15 | Finanzas: crea los movimientos de los recurrentes y avisa cobros/pagos vencidos |

## Estructura

```
app/(auth)        login, recuperar, nueva-contrasena
app/(panel)       inicio, agenda, bandeja, catalogo, propuestas, finanzas, proyectos, demos, ajustes
app/p/[token]     propuesta pública (sin sesión)
app/api/inbox     formulario y whatsapp
lib/              acceso a datos por módulo, fechas (CDMX), pdf, inbox/adapters
components/       UI por módulo y componentes base (components/ui)
supabase/         migraciones y carga inicial del catálogo (seed/catalogo.json)
docs/             guía para conectar el formulario del sitio
```

## Finanzas

- **Tablas:** `movimientos` (ingresos y gastos; IVA 16% opcional, retenciones opcionales; `total` lo calcula
  la base) y `recurrentes` (plantillas mensuales o anuales). Solo pesos MXN.
- **Facturas:** bucket privado `facturas` (PDF, XML o foto, máx. 5 MB); se abren con link temporal de 5 min.
- **Resumen:** base de efectivo (cuenta en el mes en que se cobró o pagó). Tarjetas, gráfica de 12 meses,
  anillo de gastos por categoría (adaptado de Kokonut UI, MIT) y flujo del dinero (adaptado de Money River).
- **Exportar:** `/finanzas/exportar` descarga CSV para Excel con IVA y retenciones separados.
- **Categorías:** `lib/finanzas-tipos.ts`.

## Marca y diseño

- **Colores:** `app/globals.css` (`--ergon-*`, roles de shadcn, `--sidebar-*`, estados `--estado-*`, gráficas `--chart-*`).
  Nada de colores sueltos: todo sale de variables.
- **Tipografía:** Geist (estilo Apple, grosor variable) en `app/layout.tsx`; títulos en 700 y énfasis en 600. El PDF sigue en Lato.
- **Logo:** `components/brand/logo.tsx` con variantes `full`, `icon` y `app`, y tonos `light` (fondo navy) y
  `dark` (fondo claro). SVG limpios en `public/brand/` (sacados de los PDF de Drive, con degradado real).
  Íconos de la app (favicon, apple, 192/512, maskable) e imagen para compartir (`public/brand/og.png`).
- **Estilo general:** vidrio sobre fondo de marca (`.vidrio`, `.vidrio-solido`), tarjetas casi blancas,
  menú lateral navy que se abre al pasar el mouse, barra inferior flotante en celular.
- **Kit:** `components/ui` (shadcn + propios: `segmentos`, `stepper`, `empty-state`, `ventana`,
  `confirmar`, `flow-button`, `alert`). Avisos rápidos con `toast.success / error / info`
  (`components/avisos/toast.tsx`).
- **Animaciones:** `motion` (carga diferida con `LazyMotion`), valores compartidos en `lib/motion.ts`.
  Con "reducir movimiento" del sistema todo aparece sin movimiento.
- **Logos de marcas:** `components/logos/marcas.tsx` (Gmail, WhatsApp, Google Calendar, Drive, Forms,
  Supabase, Vercel; de simple-icons, CC0).

## Por confirmar
- Etapas del Método Ergon (hoy: Diagnóstico, Propuesta, Diseño, Desarrollo, Pruebas, Entrega, Seguimiento) en `lib/tareas-tipos.ts`.
- Textos y link de cada giro del lanzador de Demos (`components/demos/bento.tsx`).

- Dominio y subdominio del panel.
- Precios y tiempos de las variantes del catálogo.
- Si los precios de las propuestas incluyen IVA.
- Contenido de los servicios 05, 06, 20, 21, 22, 23 y 24 (sin documento Definición).
- URL de la Demo.
- CRM (siguiente etapa): agregar `cliente_id` a propuestas y mensajes.
