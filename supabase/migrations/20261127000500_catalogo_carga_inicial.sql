-- Fase 4 · Carga inicial del catálogo (generado desde supabase/seed/catalogo.json)
-- Fuente: documentos "Definición" de cada servicio en Drive > Catálogo de servicios.
-- Precios y tiempos: por definir (null). Dificultad del 32: POR CONFIRMAR (null).

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('01', 'SEO local y Google Maps', array['Presencia y captación']::text[], 'listo', 'baja', false, 'El servicio que deja al negocio completo y bien posicionado en Google y Google Maps. Se arma y mantiene el Perfil de Negocio de Google del cliente (datos, fotos, servicios, reseñas y publicaciones) y se logra que su sitio web y sus directorios digan lo mismo.', 'Negocios con ubicación física o que atienden una zona.', array['Nadie me encuentra en Google','Mi competencia sale primero','Que más gente de la zona lo encuentre en Google Maps','Que lo contacten por llamada, ruta o WhatsApp desde Google','Perfil de Negocio de Google incompleto o desactualizado']::text[], null, null, 'https://drive.google.com/drive/folders/1r9bqU2npqi8PCPcfyIveDmSswkKTKvCU')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('02', 'Reseñas automáticas (incluye encuestas de satisfacción)', array['Presencia y captación']::text[], 'pendiente', 'baja', false, 'Un sistema que le pide a cada cliente, en el momento justo, que deje su reseña en Google, sin que nadie del negocio tenga que acordarse. También ayuda a responder las reseñas, avisa cuando llega una negativa e incluye encuestas de satisfacción cortas y privadas (antes servicio 07).', 'Negocios que viven de la confianza local: clínicas, estéticas, restaurantes, talleres, gimnasios, despachos, escuelas e inmobiliarias.', array['Tener más reseñas y mejor calificación en Google Maps','Dejar de pedir reseñas a mano o de olvidarse de hacerlo','Enterarse rápido de una reseña mala para responderla a tiempo','Responder reseñas con más orden y rapidez','Saber cómo ve el cliente su experiencia (encuestas de satisfacción)','Recuperar a tiempo a un cliente molesto']::text[], 'El negocio no tiene perfil de Google Maps o no está bien configurado: primero va el servicio 01.
Atiende a muy poca gente al mes: el QR y el mensaje manual bastan.
Quiere pagar o dar regalos por reseñas, o mandar a Google solo a los clientes contentos: Google lo prohíbe.
Su servicio tiene problemas serios de calidad: más reseñas no arreglan eso.
El cliente no quiere que se sepa que fue (ciertos servicios médicos o legales): cuidar la privacidad.', 'Enlace de reseña y código QR con el diseño del cliente.
Mensajes y plantillas listos (correo y WhatsApp).
Panel con solicitudes, clics, reseñas nuevas y calificación.
Reglas de cuándo y a quién se pide.
Encuesta de satisfacción y tablero de respuestas (según la variante).
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/15XAyoGHXc6_wVhn7O_RcphcDqtn4OvZs')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Enlace directo para reseñar, código QR para imprimir y mensaje listo para mandar a mano por WhatsApp (un clic). Encuesta de 3 preguntas con enlace o QR y envío manual.', 1 from public.servicios where numero = '02'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Todo lo del básico, más envío automático por correo después de cada servicio, un recordatorio, enlace con seguimiento de clics, registro de solicitudes, baja de contactos y límite de frecuencia. Encuesta CSAT o NPS con tablero y aviso de respuestas bajas.', 2 from public.servicios where numero = '02'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Todo lo del estándar, más envío automático por WhatsApp (servicio 09), borradores de respuesta con IA que el dueño aprueba, aviso de reseñas negativas (servicio 25), reporte de calificación y reseñas, y varias sucursales.', 3 from public.servicios where numero = '02'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('03', 'Catálogo o menú con QR', array['Presencia y captación']::text[], 'listo', 'baja', false, 'El catálogo o menú del negocio en una página para el celular, que se abre al escanear un QR. Una página sencilla con categorías, productos o platillos, fotos y precios, y un botón de WhatsApp. Se entrega con el QR listo para imprimir y diseño a la medida del negocio.', 'Restaurantes, cafeterías, tiendas, boutiques y negocios con lista de servicios.', array['Dejar de reimprimir menús y catálogos','Cambiar precios al instante','Mostrar fotos que ayudan a vender más','Recibir pedidos o consultas por WhatsApp','Menú digital con QR para restaurante']::text[], 'Negocios que no tienen su menú o catálogo definido ni precios estables.
Negocios donde los clientes no usan celular o no hay señal en el local.
Clientes que ya necesitan una tienda con pagos en línea (es otro servicio).', 'La página en línea con el diseño del negocio.
El QR con el logo y los colores del cliente.
Un diseño listo para imprimir (tarjeta de mesa, sticker o cartel).', 'https://drive.google.com/drive/folders/1vmN7OmoUFP6y4fMvbOnFUVIAQYMiVmKc')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Catálogo o menú con QR, solo para ver.', 1 from public.servicios where numero = '03'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Más categorías, buscador y botón de WhatsApp que manda el pedido.', 2 from public.servicios where numero = '03'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Carrito de pedido y conexión con inventario.', 3 from public.servicios where numero = '03'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('04', 'Sitio web', array['Presencia y captación']::text[], 'listo', 'media', false, 'Una página web hecha a la medida del negocio, con su logo, sus colores y un diseño propio, publicada en su dominio. Presenta al negocio y le da al visitante formas fáciles de contactarlo: WhatsApp, llamada, mapa y formulario. Pensada primero para celular.', 'Negocios que no tienen sitio web, o que tienen uno viejo, lento o que no se ve bien en el celular: spas, salones, restaurantes, consultorios, talleres, despachos, escuelas y tiendas locales.', array['Dar una imagen profesional y confiable','Que lo encuentren en Google (SEO básico)','Recibir contactos y clientes las 24 horas sin depender solo de redes sociales','Tener un lugar propio con servicios, horarios, ubicación y contacto','No tengo página web','Mi página es vieja o no se ve bien en el celular']::text[], 'El cliente no tiene ni quiere dar contenido (fotos, textos, datos del negocio).
Necesita vender y cobrar en línea: ahí es el servicio 05 Tienda en línea.
Solo necesita aparecer bien en Google Maps: basta el servicio 01.
Ya tiene un sitio que funciona bien y solo quiere cambios pequeños.
Quiere cambiar el contenido todos los días y no acepta un panel de edición.', 'Sitio publicado en el dominio del cliente.
Versión para celular y computadora, rápida y accesible.
Formulario y botón de WhatsApp funcionando.
SEO básico: títulos, descripciones, mapa y datos del negocio para Google.
Aviso de privacidad si el formulario recoge datos.
Accesos entregados y una guía corta de cómo pedir cambios.', 'https://drive.google.com/drive/folders/19Zi-suG4fm58g1xg3nQ4lbpLfM_r1Pn8')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Una sola página (landing): presentación, servicios, galería, ubicación y botón de WhatsApp. Sin integraciones.', 1 from public.servicios where numero = '04'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Varias páginas (inicio, servicios, nosotros, contacto), formulario de contacto, mapa, galería, SEO básico y personalización completa del diseño.', 2 from public.servicios where numero = '04'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'A la medida: blog, panel para que el cliente edite su contenido, varios idiomas, reservas o integraciones con otros servicios.', 3 from public.servicios where numero = '04'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('05', 'Tienda en línea', array['Presencia y captación','Cobros y dinero']::text[], 'proximamente', 'alta', false, null, null, array['Vender en línea','Tienda en línea con carrito y pagos','Cobrar pedidos por internet']::text[], null, null, 'https://drive.google.com/drive/folders/1SR2gZ9G-qIwx7BVZhdxyhXWwElic4uqo')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('06', 'Lista de espera', array['Agenda y atención']::text[], 'pendiente', 'baja', false, null, null, array['Lista de espera o turnos para clientes que llegan sin cita','Avisar al cliente cuando es su turno','Filas largas en el local']::text[], null, null, 'https://drive.google.com/drive/folders/1T3Uosvn7gjkmhLOlVg-DmBnBdl9K6sZs')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('08', 'Agenda en línea', array['Agenda y atención']::text[], 'listo', 'media', false, 'Un sistema de citas en línea hecho a la medida del negocio. El cliente elige servicio, día y hora desde un enlace, y el dueño maneja todo desde un panel propio: confirmar, mover, cancelar y mandar recordatorios.', 'Negocios que viven de citas: spas, salones de belleza, barberías, consultorios, psicólogos, dentistas, entrenadores, talleres, despachos y asesores.', array['Evitar los mensajes de ida y vuelta para acordar una hora','Reducir las faltas con recordatorios de citas','Evitar empalmes y citas dobles','Ordenar el día y saber cuánto trabajo tiene cada empleado','Recibir citas las 24 horas, incluso cerrado','Agendar citas en línea']::text[], 'Recibe muy pocas citas y las maneja bien por WhatsApp.
Atiende solo por llegada, sin cita (mejor una lista de espera, servicio 06).
Sus horarios cambian constantemente y nadie va a mantener el panel al día.
Necesita cobrar en línea desde el inicio: se combina con el servicio 15.
Quiere recordatorios automáticos pero no quiere cuenta de WhatsApp Business ni pagar por mensaje.', 'Página de reservas con el diseño del cliente, lista para celular.
Panel del dueño: agenda del día y la semana, citas, servicios, horarios, empleados y clientes.
Correo de confirmación al cliente y aviso al negocio.
Plantilla de mensajes (confirmación, recordatorio, cancelación y más).
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/1ZE_2GFG1Kq6_L3VA5yq5RjlUM0IsXI1Q')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Servicios, horarios, reserva por enlace y panel del dueño con la lista de citas. Sin integraciones.', 1 from public.servicios where numero = '08'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Varios empleados, cancelar y reprogramar, bloqueo de días y horas, y recordatorios manuales con un clic por WhatsApp o correo.', 2 from public.servicios where numero = '08'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Recordatorios automáticos por WhatsApp (servicio 09), lista de espera (06), anticipo o pago en línea (15) y asistente con IA que agenda.', 3 from public.servicios where numero = '08'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('09', 'Automatización de WhatsApp', array['Agenda y atención']::text[], 'pendiente', 'media', false, 'Un módulo que conecta el negocio con WhatsApp por la API oficial de WhatsApp Business. Manda avisos automáticos (citas, pagos, reportes, alertas) y responde solo con menús y reglas, con una bandeja donde una persona puede atender las conversaciones.', 'Negocios que ya atienden por WhatsApp y mandan los mismos mensajes todos los días: clínicas, estéticas, talleres, restaurantes, despachos, escuelas y tiendas.', array['Que los avisos de WhatsApp salgan solos y a tiempo, sin mandar mensajes a mano','Que el cliente reciba respuesta rápida, incluso fuera de horario','Tener todas las conversaciones de WhatsApp en un solo lugar','Respuestas automáticas con menú en WhatsApp','Base para recordatorios de citas y pagos por WhatsApp']::text[], 'Manda muy pocos mensajes: el botón manual (wa.me) basta.
No quiere abrir una cuenta de Meta Business ni pagar por mensaje.
Quiere mandar mensajes masivos a personas que no dieron permiso: Meta puede bloquear el número.
Quiere usar WhatsApp Web automatizado o librerías no oficiales: no lo hacemos.
Solo necesita que un chatbot conteste: va mejor el servicio 11.', 'Número conectado a la API oficial, con el webhook funcionando.
Plantillas enviadas a Meta y aprobadas.
Respuestas automáticas y bandeja (según la variante).
Panel con el diseño del cliente, historial y registro de envíos.
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/1hQtlG85xsPqWYTnowX2x1wK1TXOm8PNE')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Avisos salientes con plantillas aprobadas, permiso (opt-in) y baja de cada persona, y registro de lo enviado, entregado, leído y fallido.', 1 from public.servicios where numero = '09'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Todo lo del básico, más respuesta automática con menú y palabras clave, mensaje fuera de horario y bandeja de conversaciones donde una persona puede contestar.', 2 from public.servicios where numero = '09'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Todo lo del estándar, más flujos (estatus de pedido), etiquetas, varios agentes con asignación, difusiones a listas con permiso, conexión con el CRM y posibilidad de sumar el chatbot con IA (11) y el clasificador (12).', 3 from public.servicios where numero = '09'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('10', 'Tarjeta de lealtad digital', array['Agenda y atención']::text[], 'listo', 'media', false, 'Una tarjeta de cliente frecuente digital, con el logo y los colores del negocio, que reemplaza la tarjetita de cartón con sellos. El cliente la guarda en el Wallet de su celular, como imagen o desde un enlace; el personal suma sellos o puntos escaneando su código.', 'Negocios con clientes que vuelven seguido: cafeterías, restaurantes, barberías, salones, spas, tiendas, gimnasios, lavanderías y estéticas.', array['Que los clientes regresen más seguido','Saber quiénes son los clientes más fieles y cuántas veces vienen','Que no se pierdan ni se falsifiquen las tarjetas de cartón','Tener una lista de clientes para avisos y promociones','Programa de puntos o sellos para clientes frecuentes']::text[], 'Sus clientes compran una sola vez y casi nunca regresan (muebles o autos).
No tiene personal que pueda escanear con el celular en cada visita.
No quiere pedir datos a sus clientes (nombre y teléfono).
Ya tiene un programa de lealtad integrado a su caja o sistema de ventas.
Quiere Wallet pero todavía no están las cuentas de Apple y Google de Ergon.', 'Página de registro y tarjeta con el diseño del cliente.
Tarjeta en Apple Wallet y Google Wallet, imagen en Fotos y enlace web.
Panel para el personal (sumar sellos o puntos, entregar premios) y para el dueño (clientes, visitas, premios y reportes).
Aviso de privacidad y casilla de aceptación en el registro.
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/1Z-tdn1xk76-X72gqT2hFxVvqpbFvKXE3')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Sellos por visita, un premio, registro de clientes, panel simple y las cuatro formas de guardar la tarjeta (Wallet incluido).', 1 from public.servicios where numero = '10'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Puntos por monto de compra, varios premios, niveles, vencimiento de puntos y aviso manual por WhatsApp cuando gana un premio.', 2 from public.servicios where numero = '10'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Avisos automáticos por WhatsApp (servicio 09), promociones por tipo de cliente, cumpleaños y reportes.', 3 from public.servicios where numero = '10'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('11', 'Chatbot con IA', array['Agenda y atención']::text[], 'proximamente', 'alta', true, 'Un asistente con inteligencia artificial que conversa con los clientes del negocio por WhatsApp o desde su sitio web. Contesta con la información real del negocio, pide los datos que hacen falta y pasa la conversación a una persona cuando no sabe o cuando el cliente lo pide.', 'Negocios que reciben muchas preguntas por WhatsApp o por su sitio: clínicas, estéticas, talleres, restaurantes, escuelas, inmobiliarias, despachos y tiendas.', array['Atender a los clientes a cualquier hora, incluso fuera de horario','Responder preguntas repetidas sin contestarlas una por una','Captar los datos de prospectos ordenados en el CRM','Agendar citas sin llamadas ni idas y vueltas','Me escriben mucho por WhatsApp y no alcanzo a contestar']::text[], 'Casi todas las conversaciones necesitan criterio humano: contratos, casos médicos o legales, negociaciones.
El negocio no tiene su información ordenada (precios, horarios, políticas).
Recibe muy pocos mensajes: el servicio 09 con menú basta.
Quiere que el chatbot dé diagnósticos, asesoría legal o fiscal, o promesas que no puede cumplir.
Quiere WhatsApp automático pero no quiere cuenta de Meta Business ni pagar por mensaje.
No quiere que las conversaciones se envíen a un proveedor de IA externo.', 'Chatbot funcionando en WhatsApp y/o en el sitio web, con la voz y la información del negocio.
Panel para ver conversaciones, tomar el control y editar la información y las reglas.
Resumen de cada conversación y prospectos guardados.
Registro de uso y consumo de la IA.
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/106jhLm6ZOq2kUfsHs6SMu1it9EloXUKJ')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Responde preguntas frecuentes con la información cargada, pide nombre, teléfono y qué necesita, y pasa a una persona cuando no sabe. En WhatsApp o sitio web.', 1 from public.servicios where numero = '11'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Todo lo del básico, más documentos del negocio como base de conocimiento, resumen de cada conversación, mensaje fuera de horario y bandeja para tomar el control. WhatsApp y sitio web.', 2 from public.servicios where numero = '11'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Todo lo del estándar, más agendar, mover y cancelar citas (servicio 08), consultar estatus de pedidos o trámites, calificar prospectos en el CRM y entender notas de voz.', 3 from public.servicios where numero = '11'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('12', 'Clasificar y responder mensajes con IA', array['Agenda y atención']::text[], 'proximamente', 'alta', true, 'Un sistema que lee los mensajes que llegan al negocio (WhatsApp, correo, formularios), les pone una etiqueta y una prioridad con inteligencia artificial, y le deja a una persona un borrador de respuesta para aprobar, editar o mandar.', 'Negocios que reciben muchos mensajes y los atienden entre varias personas: clínicas, escuelas, despachos, tiendas, inmobiliarias, distribuidores y empresas de servicios.', array['Que nada urgente se pierda entre cientos de mensajes','Ahorrar tiempo contestando con un borrador listo','Repartir los mensajes entre las personas del equipo según el tema','Saber de qué se quejan o qué piden más los clientes','Recibo demasiados mensajes de WhatsApp y correo']::text[], 'Recibe pocos mensajes al día: una bandeja normal basta.
Quiere que la IA conteste sola todo: para eso va el servicio 11.
Sus mensajes son casi todos distintos y de mucho criterio (casos legales o médicos).
No quiere que sus mensajes se envíen a un proveedor de IA externo.
No tiene a nadie que revise los borradores.', 'Bandeja unificada con etiquetas, prioridad y borradores.
Etiquetas y reglas configuradas con el cliente.
Aviso de mensajes urgentes.
Registro de uso y consumo de la IA.
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/1sxpKAIfKiN6KM_rE6AkO3OMadgP9mLsO')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Etiqueta cada mensaje por tema (cita, precio, queja, factura, urgente, otro) y lo muestra en una bandeja con filtros.', 1 from public.servicios where numero = '12'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Todo lo del básico, más prioridad, borrador de respuesta para aprobar o editar, y aviso de mensajes urgentes (servicio 25).', 2 from public.servicios where numero = '12'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Todo lo del estándar, más reglas por etiqueta (asignar a persona o área), respuestas automáticas solo para casos simples autorizados, reporte de temas y quejas, y conexión con el CRM.', 3 from public.servicios where numero = '12'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('14', 'Recordatorios de pago', array['Cobros y dinero']::text[], 'listo', 'baja', false, 'Un panel a la medida que le recuerda al cliente del negocio que tiene un pago por vencer o atrasado. El dueño ve su lista de pagos (cliente, monto, vencimiento y estado), manda los recordatorios con un botón y consulta el historial de avisos. Además sale un correo automático cada día.', 'Negocios con mensualidades, rentas, crédito o servicios recurrentes: gimnasios, escuelas, despachos, clínicas y similares.', array['Cobrar a tiempo sin andar persiguiendo a nadie','Saber de un vistazo quién pagó y quién no','Mandar siempre mensajes de cobro amables y bien escritos','Me deben dinero y se me olvida cobrar','Clientes que se atrasan en sus pagos']::text[], 'Negocios sin pagos recurrentes o con muy pocos cobros al mes.
Clientes que no tienen el teléfono o el correo de sus deudores.
Clientes que quieren mensajes agresivos o amenazantes.
Clientes que necesitan cobrar en línea: eso es el servicio 15.', 'El panel en línea con el diseño del negocio.
Usuarios y accesos para quien lo vaya a usar.
Los mensajes de recordatorio ajustados al tono del cliente.
Una guía corta de uso para el cliente.', 'https://drive.google.com/drive/folders/1nRA_yCqxkttKQHAJJx44pmP8hdMxCgqs')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Nivel 1, manual: el botón "Recordar por WhatsApp" abre el chat con el mensaje ya escrito y el dueño solo toca enviar. El correo sale solo cada día.', 1 from public.servicios where numero = '14'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Nivel 2, automático: el WhatsApp se manda solo con la API oficial de WhatsApp Business (servicio 09). Requiere cuenta de Meta, número dedicado y mensajes aprobados; Meta cobra por mensaje.', 3 from public.servicios where numero = '14'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('15', 'Links y pagos en línea', array['Cobros y dinero']::text[], 'pendiente', 'media', false, 'Un sistema a la medida para que un negocio cobre en línea con un link. El negocio crea el cobro, el cliente paga con tarjeta, SPEI u OXXO desde su celular, y el sistema marca solo si ya se pagó y manda el comprobante. El dinero va directo a la cuenta del negocio.', 'Negocios que cobran servicios, anticipos o saldos de una sola vez: clínicas, despachos, escuelas, gimnasios, talleres, estéticas, fotógrafos, eventos e inmobiliarias.', array['Cobrar anticipos, servicios y saldos sin pedir transferencias a mano ni confirmar capturas','Saber qué está pagado, pendiente o vencido','Dar al cliente una forma fácil y segura de pagar desde el celular con tarjeta, SPEI u OXXO','Tener cada cobro registrado con comprobante','Cobrar en línea con link de pago']::text[], 'El negocio no puede abrir una cuenta en una pasarela de pago.
Cobra muy pocas veces al mes: una transferencia o un link manual de su pasarela bastan.
Cobra solo en efectivo, en mostrador.
Quiere que cada cobro genere su factura sola: queda fuera.
Necesita cobros que se repiten cada mes: es el servicio 18.', 'Panel de cobros en línea con el diseño del negocio.
Página de pago con el logo y los colores del negocio.
Pasarela conectada y probada, con confirmación automática.
Mensajes de cobro y comprobantes ajustados al tono del cliente.
Usuarios y accesos.
Guía corta de uso: cobrar, reembolsar y qué hacer ante una disputa.', 'https://drive.google.com/drive/folders/11VX7GhmTsq8QaBDjNURoGh5xw8TLkwTt')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Todo junto: links de cobro, página de pago con el diseño del negocio, tarjeta/SPEI/OXXO según la pasarela, confirmación automática, comprobante, pagos parciales (anticipo y saldo), vencimiento, reembolsos, envío por WhatsApp o correo, panel con reportes y exportación, sucursales y roles.', 1 from public.servicios where numero = '15'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('16', 'Estados de cuenta', array['Cobros y dinero']::text[], 'pendiente', 'media', false, 'Un sistema a la medida que muestra a cada cliente de un negocio su estado de cuenta: lo que se le cobró, lo que ha pagado y lo que todavía debe. El negocio lo ve en su panel y el cliente lo abre con un link seguro desde el celular, con PDF descargable.', 'Negocios con clientes que pagan varias veces o a plazos: gimnasios, escuelas, despachos, clínicas, rentas, talleres y cualquier negocio que dé crédito.', array['Evitar el "yo ya pagué" contra el "no lo veo"','Dejar de armar estados de cuenta a mano en Excel','Que el cliente entienda cuánto debe y por qué','Saber cuánto le deben al negocio y qué saldos están atrasados','Clientes con pagos a plazos o crédito']::text[], 'Negocios que cobran todo al momento y no tienen saldos ni pagos a plazos.
Muy pocos clientes con cuenta: un mensaje con el saldo a mano basta.
El negocio no lleva un registro ordenado de lo que cobra: primero hay que ordenarlo.
Quiere que el estado de cuenta tenga validez fiscal: eso es facturación y queda fuera.', 'Panel de estados de cuenta con el diseño del negocio.
Página del cliente con link seguro y PDF con el diseño del negocio.
Mensajes de envío ajustados al tono del cliente.
Cargas iniciales de clientes, cargos y pagos desde su Excel.
Usuarios y accesos.
Guía corta de uso.', 'https://drive.google.com/drive/folders/1Ik1WHQ19aEVzoTaH4gRdaNtpoxSteNAz')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Todo junto: cuenta por cliente con cargos, pagos y saldo calculado; captura manual, desde Excel o desde los servicios 14 y 15; página del cliente con link seguro; PDF; envío manual o programado; link de pago (15); antigüedad de saldos; ajustes con registro; reportes y exportación; sucursales y roles.', 1 from public.servicios where numero = '16'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('17', 'Lectura de facturas con IA', array['Cobros y dinero']::text[], 'listo', 'alta', true, 'Una página donde el negocio sube sus facturas (PDF, foto o XML) y una inteligencia artificial las lee sola. Los datos quedan ordenados en una tabla, listos para buscar, filtrar y pasar a Excel. Una persona revisa y confirma antes de guardar.', 'Negocios que reciben muchas facturas de proveedores o de gastos: restaurantes, tiendas, constructoras, talleres, clínicas, despachos y distribuidores. También contadores y administradores que hoy capturan a mano.', array['Dejar de capturar facturas a mano','Tener todas las facturas en una sola tabla con búsqueda y filtros','Detectar facturas repetidas y totales que no cuadran','Pasar la información a Excel o al contador sin retrabajo','Leer facturas en PDF o foto']::text[], 'Recibe pocas facturas al mes: capturarlas a mano sale más barato.
Todas sus facturas ya traen XML y solo necesita ordenarlas: se puede hacer sin IA.
No quiere que sus facturas se envíen a un proveedor de IA externo.
Espera lectura perfecta sin ninguna revisión.
Necesita contabilidad completa o declaraciones: es otro tipo de sistema.', 'Panel para subir, revisar y consultar facturas, con el diseño del cliente.
Lectura con IA configurada con las instrucciones, categorías y ejemplos del negocio.
Exportación a Excel con las columnas que el cliente necesita.
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/1wM8ILId_iLVhieThZWdG2CnqUGmofscj')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Subir facturas una por una (PDF, foto o XML), lectura con IA, pantalla de revisión y corrección, lista de facturas y exportar a Excel.', 1 from public.servicios where numero = '17'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Todo lo del básico, más carga de varias facturas a la vez, detección de duplicados, categorías, filtros y búsqueda, varios usuarios y memoria por proveedor.', 2 from public.servicios where numero = '17'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Todo lo del estándar, más conceptos línea por línea, alerta cuando el total no cuadra, recepción de facturas por correo, panel de reglas, reporte de aciertos de la IA y conexión con el CRM u otro sistema.', 3 from public.servicios where numero = '17'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('18', 'Membresías y suscripciones', array['Cobros y dinero','Agenda y atención']::text[], 'pendiente', 'alta', false, 'Un sistema a la medida para negocios con socios o suscriptores que pagan una cuota cada periodo. Lleva a cada socio con su plan, su fecha de pago y su estado (al corriente, por vencer, vencido), genera el cobro de cada cuota y registra el pago.', 'Negocios con cuotas recurrentes: gimnasios, clubes, academias, escuelas, estudios de yoga o baile, coworkings, asociaciones y despachos con iguala mensual.', array['Saber de un vistazo quién está al corriente y quién no','Dejar de cobrar cuota por cuota a mano y de llevar la lista en un cuaderno o Excel','Cobrar a tiempo con menos olvidos y pagos atrasados','Ver cuántos socios entran, se van y renuevan cada mes','Cobro de mensualidades o suscripciones']::text[], 'El negocio tiene muy pocos socios: una lista y un mensaje bastan.
Cobra todo en efectivo y no quiere llevar un registro.
No puede abrir una cuenta en una pasarela y quiere cobro automático.
Lo que necesita es reservar clases o citas: eso es el servicio 08.
Quiere un sistema completo con muchas funciones propias: eso es el servicio 31.', 'Panel de membresías con el diseño del negocio.
Socios y planes cargados desde su Excel.
Pasarela conectada y probada, con las formas de cobro que el negocio elija.
Mensajes de cuotas, avisos y comprobantes ajustados al tono del cliente.
Credencial con QR, si la quiere.
Usuarios y accesos.
Guía corta de uso.', 'https://drive.google.com/drive/folders/1hLgpfBX7WlI4IavDmix3raQ_6vXbJSjo')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Todo junto, sin IA: socios y planes, cuotas automáticas por periodo, estados (activa, por vencer, en gracia, vencida, pausada, cancelada), tres formas de cobro (tarjeta automática, link de pago del 15, efectivo o transferencia), recordatorios (14), estado de cuenta (16), credencial con QR opcional, reportes, sucursales y roles.', 1 from public.servicios where numero = '18'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('19', 'Formularios digitales', array['Operación interna']::text[], 'listo', 'baja', false, 'Formularios en línea con el logo y los colores del negocio, que se abren por enlace o QR y reemplazan el papel y los Excel. Las respuestas llegan ordenadas a un panel (o al CRM) y el negocio recibe un aviso por correo.', 'Cualquier negocio que hoy pida datos en papel, en Excel o por mensajes: clínicas, talleres, restaurantes, gimnasios, escuelas y empresas.', array['Dejar de capturar datos a mano','No perder papeles ni mensajes sueltos','Recibir los datos completos sin campos vacíos','Tener todo guardado, buscable y exportable','Inscripciones, registros, pedidos especiales, cotizaciones, quejas o checklists en papel']::text[], 'Negocios que casi no recogen datos o solo necesitan un formulario una vez: uno gratuito basta.
Formularios con datos muy sensibles si el cliente no tiene aviso de privacidad ni quiere cuidarlos.
Clientes que necesitan cobrar en el formulario: eso es el servicio 15.', 'El formulario en línea con el diseño del negocio.
El panel con usuarios y accesos (versión independiente), o la conexión con el CRM.
El enlace y el QR del formulario.
Una guía corta de uso para el cliente.', 'https://drive.google.com/drive/folders/193KutW0_-TPi2y_oRl-eQahRvPKXsz3z')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Formulario a la medida con panel para ver, filtrar, exportar y cambiar el estado de las respuestas, y aviso por correo (o conexión directa con el CRM). Extras opcionales: fotos y archivos adjuntos, correo de confirmación y aviso por WhatsApp (09).', 1 from public.servicios where numero = '19'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('20', 'Inventario con QR', array['Operación interna']::text[], 'proximamente', 'media', false, null, null, array['Control de inventario','Saber cuánto tengo en existencia','Entradas y salidas de productos con QR']::text[], null, null, 'https://drive.google.com/drive/folders/1LQs1Xo4aGYgGozVLZhkmptcC9ddA0z2f')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('21', 'CRM sencillo', array['Operación interna']::text[], 'listo', 'media', false, null, null, array['Tener a mis clientes y prospectos en un solo lugar','Dar seguimiento a clientes y prospectos','Historial de cada cliente']::text[], null, null, 'https://drive.google.com/drive/folders/1egM37L6-uRVQF9dDc_ZQK9L7iSncxWkO')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('22', 'OCR de documentos', array['Operación interna','Datos y decisiones']::text[], 'proximamente', 'media', true, null, null, array['Pasar documentos en papel o PDF a datos','Dejar de capturar documentos a mano','Leer documentos escaneados o fotos']::text[], null, null, 'https://drive.google.com/drive/folders/1zEBxUIOMTh2AHR7j2rforQWHUPqgzK1J')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('23', 'Resumen de llamadas o notas', array['Operación interna']::text[], 'proximamente', 'alta', true, null, null, array['Resumir llamadas, juntas o notas de voz','No perder acuerdos de una reunión','Transcribir y resumir audios']::text[], null, null, 'https://drive.google.com/drive/folders/1wGhlDC7va4I7HMfE3Gc9CEKtiT-8KqJ3')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('24', 'Asistente con documentos del negocio', array['Operación interna']::text[], 'proximamente', 'alta', true, null, null, array['Preguntarle a una IA sobre los documentos del negocio','Encontrar rápido información en manuales y políticas','Que el equipo resuelva dudas sin preguntar a todos']::text[], null, null, 'https://drive.google.com/drive/folders/1gcmm4qeg2rH43nRqdtD4a9rILgC5aFmp')
on conflict (numero) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('25', 'Alertas automáticas', array['Datos y decisiones']::text[], 'listo', 'baja', false, 'Avisos automáticos para el dueño o su equipo cuando algo importante pasa en los datos del negocio. El negocio define reglas simples ("si pasa esto, avísame") y un panel revisa los datos todos los días y manda el aviso por correo y dentro del panel.', 'Cualquier negocio que maneje inventario, pagos, ventas, citas o tareas.', array['Enterarse a tiempo de lo que importa','Dejar de revisar Excel o cuadernos todos los días','Actuar antes de que el problema crezca','Aviso de stock bajo o producto que se acaba','Aviso de pago vencido, ventas bajo la meta o cita sin confirmar']::text[], 'Negocios que no llevan sus datos de forma digital ni los van a mantener actualizados.
Clientes que necesitan avisos al instante: la revisión es programada, no en tiempo real.
Clientes que quieren alertas por todo: demasiados avisos hacen que se ignoren.', 'El panel en línea con el diseño del negocio.
Las reglas de alerta configuradas y probadas.
Usuarios y accesos (versión independiente), o la conexión con el CRM.
Una guía corta de uso para el cliente.', 'https://drive.google.com/drive/folders/1azt0uA3kiZWTVpy4uZGxvA8aFKDIVwZH')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Reglas ya hechas (stock bajo, pago vencido, ventas bajo meta, cita sin confirmar) y reglas nuevas a la medida, revisión programada y avisos por correo y dentro del panel. Extra: aviso por WhatsApp (servicio 09).', 1 from public.servicios where numero = '25'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('27', 'Tableros de ventas', array['Datos y decisiones']::text[], 'listo', 'media', false, 'Un tablero en línea con las ventas del negocio, en gráficas y números claros, con su logo y sus colores. Muestra cuánto se vende, qué se vende más, en qué días, quién vende y cómo va contra el periodo anterior y contra la meta.', 'Negocios que anotan sus ventas en Excel, cuaderno o caja y nunca ven el panorama completo: tiendas, restaurantes, distribuidores, talleres, clínicas, gimnasios y negocios con varias sucursales.', array['Decidir con datos y no con intuición','Saber si el negocio va rumbo a su meta del mes','Ver de un vistazo lo que hoy toma horas en Excel','Detectar a tiempo una caída de ventas','No sé cuánto vendo ni qué se vende más']::text[], 'No registra sus ventas y no está dispuesto a hacerlo.
Tiene muy pocas ventas al mes: un Excel le basta.
Solo quiere recibir un reporte periódico: basta el servicio 28.
Ya usa un sistema de caja con sus propios tableros completos.
Sus datos están muy desordenados y no quiere limpiarlos.', 'Tablero en línea con el diseño del cliente, para celular y computadora.
Importación de ventas con revisión de errores y captura manual.
Usuarios con permisos (dueño y gerentes).
Plantilla de datos para cargar ventas siempre igual.
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/1yvMsuzjY382GEWa-H6StbBs8HrdIlyEC')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'basico', 'Ventas por día, semana y mes, comparación con el periodo anterior, productos más vendidos, importar Excel y capturar ventas.', 1 from public.servicios where numero = '27'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Por vendedor, sucursal y categoría, metas, filtros, exportar a Excel y Google Sheets conectado.', 2 from public.servicios where numero = '27'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Varias fuentes de datos, resumen con IA, y conexión con alertas (25) y reportes automáticos (28).', 3 from public.servicios where numero = '27'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('28', 'Reportes automáticos', array['Datos y decisiones']::text[], 'listo', 'media', false, 'Un sistema que arma y manda los reportes del negocio solo, en el día y la hora que se elijan, con su diseño. Cada día, semana o mes toma las cifras (ventas, citas, clientes, cobros) y manda el resumen por correo con PDF y enlace en línea.', 'Dueños, gerentes y socios que hoy piden los reportes por WhatsApp, los arman a mano o los mandan tarde: negocios con sucursales, despachos, clínicas, tiendas, restaurantes y distribuidores.', array['Enterarse de cómo va el negocio sin pedir nada ni abrir un Excel','Ahorrar las horas de armar el reporte semanal o de fin de mes','Que los reportes lleguen siempre a tiempo y a las personas correctas','Tener un historial de reportes para comparar']::text[], 'El negocio no registra sus datos en ningún lado: sin datos no hay reporte.
Los datos cambian de formato cada vez y nadie los mantiene ordenados.
Quiere avisos inmediatos de eventos, no resúmenes: es el servicio 25.
Solo necesita un reporte una vez al año.
Quiere WhatsApp automático pero no quiere cuenta de WhatsApp Business ni pagar por mensaje.', 'Reportes con el diseño del cliente para correo, PDF y página en línea.
Horarios y destinatarios configurados.
Panel para ver el historial, pausar un reporte y enviarlo en el momento.
Aviso al responsable si un reporte falla.
Accesos entregados y una guía corta de uso.', 'https://drive.google.com/drive/folders/13rlG8Jsi4K0dfSIQpI3kAJkDqVPuSxTg')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'estandar', 'Reportes periódicos por correo con PDF y enlace en línea, para uno o varios destinatarios. Hasta 3 reportes con su horario, historial de envíos y aviso manual por WhatsApp.', 2 from public.servicios where numero = '28'
on conflict (servicio_id, nombre) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'avanzado', 'Sin IA: reportes por sucursal o por cliente, varias fuentes de datos, panel para armar reportes y horarios, botón para pedir un reporte en el momento y WhatsApp automático (servicio 09).', 3 from public.servicios where numero = '28'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('30', 'Conectar herramientas entre sí', array['Datos y decisiones']::text[], 'pendiente', 'media', false, 'Un servicio a la medida para conectar entre sí las herramientas que el negocio ya usa (Google, WhatsApp, pasarela de pago, tienda, correo) y con los sistemas de Ergon, para que los datos pasen solos y nadie capture lo mismo dos veces. Cada conexión queda documentada, probada y con responsable.', 'Negocios que ya usan varias herramientas separadas y pierden tiempo copiando datos de una a otra: clínicas, despachos, tiendas, escuelas, gimnasios y talleres.', array['Dejar de capturar la misma información en varios lugares','Evitar errores y datos que no coinciden entre herramientas','Enterarse a tiempo de lo que pasa en el negocio','Aprovechar las herramientas que ya paga en lugar de cambiarlo todo','Conectar Google Sheets, Calendar, WhatsApp, pasarela o tienda en línea','Automatizar tareas repetitivas entre aplicaciones']::text[], 'El negocio usa una sola herramienta o casi no copia datos entre ellas.
Sus herramientas no tienen conexión oficial y todo se resuelve con un archivo exportado.
Quiere conectar algo dándonos su contraseña: no se hace.
Necesita un sistema completo nuevo: eso es el servicio 31.', 'Inventario y mapa de conexiones aprobados por el cliente.
Las conexiones funcionando y probadas.
Panel de conexiones con estado, historial y avisos de falla.
Una ficha por conexión.
Guía corta de uso: qué hacer si una conexión falla y cómo revocar un permiso.', 'https://drive.google.com/drive/folders/1uScq31LQOd7n1ktCj9XnaVKghDcY31Pm')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Todo junto: inventario de herramientas, mapa de conexiones, conexiones listas y probadas (API, webhooks, puentes o archivo exportado), ficha por conexión, panel de conexiones, reintentos y avisos, sin duplicados, plan B documentado, IA opcional y revisión a las 4 semanas.', 1 from public.servicios where numero = '30'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('31', 'Sistema o app a la medida', array['A la medida']::text[], 'pendiente', 'alta', false, 'Un sistema o app hecho a la medida para una necesidad del negocio que no cabe en ningún otro servicio del catálogo. Es una página web con panel, para celular y computadora e instalable como app; se construye por etapas después de un descubrimiento y un alcance aprobado por escrito.', 'Negocios que hoy llevan un proceso en cuadernos, Excel, WhatsApp o varias herramientas sueltas y necesitan algo propio: pedidos y entregas, órdenes de trabajo de taller, rutas y visitas, inspecciones o checklists con fotos y firma, rentas, préstamos de equipo o turnos.', array['Control de pedidos y entregas con estado y responsable','Órdenes de trabajo, avance y tiempos de producción o taller','Rutas y visitas: quién va, a dónde y qué reportó','Inspecciones o checklists con fotos y firma','Control de rentas, préstamos de equipo o turnos','Necesito un sistema propio para mi proceso']::text[], 'Lo que necesita ya existe en el catálogo (agenda, cobros, membresías, CRM): se vende ese servicio.
Necesita varios servicios juntos en un solo panel: es el servicio 33.
Es un ERP completo, contabilidad formal o facturación (CFDI): no lo hacemos.', 'Ficha de descubrimiento y alcance aprobada.
Sistema publicado en el dominio del cliente.
Accesos y manual de una página.
Capacitación corta con su equipo.', 'https://drive.google.com/drive/folders/1r0mFju7ZHmnBUez8OpWXDovnSqH64jdn')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Descubrimiento y alcance por escrito, panel web con inicio de sesión y roles, base de datos propia con reglas por fila, reportes y exportación a Excel, carga inicial desde Excel, avisos por correo (y WhatsApp si se contrata), personalización, capacitación, manual y periodo de ajustes. Se construye por etapas.', 1 from public.servicios where numero = '31'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('32', 'Panel de finanzas', array['Cobros y dinero']::text[], 'pendiente', null, false, 'El "CRM del dinero": un panel donde el negocio ve a dónde llega y a dónde sale su dinero (ingresos, gastos, cuentas, lo que le deben, lo que debe y su flujo de caja). Pensado para el dueño y su equipo, no para el contador.', 'Negocios que hoy llevan sus números en Excel, en un cuaderno o en la cabeza, y quieren saber cuánto entra, cuánto sale y cuánto les queda.', array['Saber cuánto entra, cuánto sale y cuánto me queda','Ver el flujo de caja de la semana y el mes con proyección','Llevar ingresos y gastos ordenados por categoría y cuenta','Saber quién me debe y a quién le debo','Reportes en Excel y PDF para el contador']::text[], 'Necesita facturación (CFDI), impuestos, declaraciones o contabilidad formal.
Necesita nómina formal (IMSS).
Quiere que el panel mueva dinero o se conecte directo al banco.
Busca asesoría fiscal o financiera: el panel muestra números, no recomendaciones.', 'Panel publicado en el dominio del cliente.
Categorías y cuentas iniciales cargadas, y saldos iniciales validados con el cliente.
Accesos y manual de una página.
Capacitación corta con quien captura y con el dueño.', 'https://drive.google.com/drive/folders/1FHMCBkkt7y0W13uOXYd2He17a7HzYlPR')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Núcleo: movimientos, cuentas, categorías y etiquetas, por cobrar, por pagar, flujo de caja con proyección a 30/60/90 días, tablero, reportes para el contador, importación del estado de cuenta del banco, roles y bitácora. Módulos opcionales: presupuesto, cierre de caja, sucursales, préstamos, reembolsos, comisiones, margen por producto y punto de equilibrio. IA opcional.', 1 from public.servicios where numero = '32'
on conflict (servicio_id, nombre) do nothing;

insert into public.servicios (numero, nombre, categorias, estado, dificultad, lleva_ia, que_es, para_quien, problemas, cuando_no_recomendar, entregables, link_drive)
values ('33', 'Software todo en uno', array['A la medida']::text[], 'pendiente', 'alta', false, 'Un solo panel para todo el negocio: un solo inicio de sesión, una sola base de datos y un solo diseño, donde el cliente activa los módulos que necesita (clientes, agenda, cobros, finanzas, inventario, avisos, reportes y más). Junta en un panel lo que ya existe en el catálogo.', 'Negocios que ya usan o necesitan varias herramientas (clientes en un lado, cobros en otro, agenda en otro, reportes en Excel) y quieren verlo todo junto.', array['Tener todo el negocio en un solo panel','Dejar de usar varias herramientas separadas','Un solo inicio de sesión para clientes, agenda, cobros y reportes','No volver a capturar al mismo cliente en varios sistemas']::text[], 'Necesita algo que no existe en el catálogo: es el servicio 31.
Necesita un ERP completo, facturación (CFDI) o contabilidad formal: no lo hacemos.
Solo necesita un servicio: se vende ese servicio solo.', 'Selección de módulos y alcance aprobado por escrito.
Panel publicado en el dominio del cliente.
Accesos, manual y capacitación corta.
Plan de las siguientes etapas.', 'https://drive.google.com/drive/folders/1hmNu5FQs25Opq3q5_2S-P-bUuoeMLbBj')
on conflict (numero) do nothing;
insert into public.servicio_variantes (servicio_id, nombre, que_incluye, orden)
select id, 'unica', 'Panel base (inicio, usuarios y roles, búsqueda, avisos, bitácora, configuración, reportes y exportación) más los módulos elegidos del Catálogo de módulos, por etapas. Se cobra por el panel base y los módulos.', 1 from public.servicios where numero = '33'
on conflict (servicio_id, nombre) do nothing;
