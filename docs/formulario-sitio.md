# Conectar el formulario del sitio a la bandeja

El panel recibe mensajes en:

```
POST https://<dominio-del-panel>/api/inbox/formulario
```

## Campos

| Campo | Obligatorio | Notas |
|---|---|---|
| `nombre` | Sí | |
| `correo` o `telefono` | Uno de los dos | |
| `mensaje` | Sí | |
| `asunto` | No | |
| `pagina` | No | Página del sitio desde donde se envió |
| `id` | No | Id propio del sitio para evitar duplicados |
| `sitio_web` | **Vacío** | Campo trampa: debe ir oculto y vacío. Si llega lleno, se rechaza. |

La **clave compartida** (`INBOX_FORM_SECRET`) va en el encabezado `x-inbox-key`.

## Respuestas

| Código | Significado |
|---|---|
| 201 | Guardado |
| 200 | Ya existía (no se duplica) |
| 400 | Faltan datos o se llenó el campo trampa |
| 401 | Clave incorrecta |
| 429 | Más de 5 envíos en 10 minutos desde la misma IP |
| 503 | El panel aún no tiene la clave configurada |

## Opción recomendada: desde el servidor del sitio

Así la clave nunca se ve en el navegador.

```js
// Por ejemplo, en una función del servidor del sitio (Astro, Next, etc.)
const respuesta = await fetch("https://<dominio-del-panel>/api/inbox/formulario", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-inbox-key": process.env.INBOX_FORM_SECRET,
  },
  body: JSON.stringify({
    nombre: datos.nombre,
    correo: datos.correo,
    telefono: datos.telefono,
    asunto: "Contacto desde el sitio",
    mensaje: datos.mensaje,
    pagina: "/contacto",
    sitio_web: datos.sitio_web, // campo trampa, debe venir vacío
  }),
});
if (!respuesta.ok) {
  // mostrar "No se pudo enviar, intenta de nuevo"
}
```

## HTML del campo trampa

```html
<!-- Oculto para personas; los bots lo llenan -->
<div style="position:absolute;left:-9999px" aria-hidden="true">
  <label for="sitio_web">No llenar</label>
  <input id="sitio_web" name="sitio_web" type="text" tabindex="-1" autocomplete="off">
</div>
```

## Si el sitio envía directo desde el navegador

Agrega el dominio del sitio a `INBOX_FORM_ORIGINS` (separados por coma) para permitir CORS.
Ten en cuenta que en ese caso la clave queda visible en el código del sitio; el límite por IP
y el campo trampa siguen protegiendo, pero es preferible la opción desde el servidor.

## Probar con curl

```bash
curl -X POST http://localhost:3000/api/inbox/formulario \
  -H "Content-Type: application/json" \
  -H "x-inbox-key: TU_CLAVE" \
  -d '{"nombre":"Prueba","correo":"prueba@ejemplo.com","mensaje":"Hola, quiero información"}'
```
