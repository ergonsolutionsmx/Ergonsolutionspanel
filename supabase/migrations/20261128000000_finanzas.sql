-- Finanzas: ingresos, gastos, recurrentes y facturas (solo pesos MXN).

-- ---------------------------------------------------------------------------
-- recurrentes: plantillas que generan un movimiento pendiente cada periodo
-- ---------------------------------------------------------------------------
create table public.recurrentes (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in ('ingreso', 'gasto')),
  concepto       text not null check (length(trim(concepto)) > 0),
  contraparte    text,
  categoria      text not null,
  proyecto_id    uuid references public.proyectos (id) on delete set null,
  subtotal       numeric(12, 2) not null check (subtotal >= 0),
  tasa_iva       numeric(5, 4) not null default 0 check (tasa_iva in (0, 0.16)),
  frecuencia     text not null default 'mensual' check (frecuencia in ('mensual', 'anual')),
  dia            smallint not null default 1 check (dia between 1 and 28),
  proxima        date not null,
  activo         boolean not null default true,
  notas          text,
  creado_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  creado_por     uuid references auth.users (id) on delete set null default auth.uid()
);

create index recurrentes_proxima_idx on public.recurrentes (proxima) where activo;

create trigger recurrentes_actualizado_en before update on public.recurrentes
  for each row execute function public.tocar_actualizado_en();
create trigger recurrentes_bitacora after insert or update or delete on public.recurrentes
  for each row execute function public.registrar_bitacora();

alter table public.recurrentes enable row level security;
create policy "miembros leen recurrentes" on public.recurrentes
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean recurrentes" on public.recurrentes
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan recurrentes" on public.recurrentes
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran recurrentes" on public.recurrentes
  for delete to authenticated using ((select privado.es_miembro()));

-- ---------------------------------------------------------------------------
-- movimientos: cada ingreso o gasto
-- ---------------------------------------------------------------------------
create table public.movimientos (
  id              uuid primary key default gen_random_uuid(),
  tipo            text not null check (tipo in ('ingreso', 'gasto')),
  concepto        text not null check (length(trim(concepto)) > 0),
  contraparte     text,  -- cliente (ingreso) o proveedor (gasto)
  categoria       text not null,
  proyecto_id     uuid references public.proyectos (id) on delete set null,
  subtotal        numeric(12, 2) not null check (subtotal >= 0),
  tasa_iva        numeric(5, 4) not null default 0 check (tasa_iva in (0, 0.16)),
  retencion_isr   numeric(12, 2) not null default 0 check (retencion_isr >= 0),
  retencion_iva   numeric(12, 2) not null default 0 check (retencion_iva >= 0),
  iva             numeric(12, 2) generated always as (round(subtotal * tasa_iva, 2)) stored,
  -- Lo que de verdad entra o sale: subtotal + IVA − retenciones.
  total           numeric(12, 2) generated always as (round(subtotal + round(subtotal * tasa_iva, 2) - retencion_isr - retencion_iva, 2)) stored,
  estado          text not null default 'pendiente' check (estado in ('pendiente', 'pagado', 'cancelado')),
  fecha           date not null default ((now() at time zone 'America/Mexico_City')::date),
  vence           date,
  pagado_en       date,
  metodo          text check (metodo in ('transferencia', 'efectivo', 'tarjeta', 'otro')),
  factura_folio   text,
  factura_archivo text,  -- ruta dentro del bucket privado "facturas"
  recurrente_id   uuid references public.recurrentes (id) on delete set null,
  notas           text,
  creado_en       timestamptz not null default now(),
  actualizado_en  timestamptz not null default now(),
  creado_por      uuid references auth.users (id) on delete set null default auth.uid(),
  constraint movimientos_pagado_con_fecha check (estado <> 'pagado' or pagado_en is not null),
  constraint movimientos_recurrente_unico unique (recurrente_id, fecha)
);

create index movimientos_fecha_idx on public.movimientos (fecha desc);
create index movimientos_pendientes_idx on public.movimientos (tipo, vence) where estado = 'pendiente';
create index movimientos_pagado_idx on public.movimientos (pagado_en) where estado = 'pagado';
create index movimientos_proyecto_idx on public.movimientos (proyecto_id);
create index movimientos_recurrente_idx on public.movimientos (recurrente_id);

create trigger movimientos_actualizado_en before update on public.movimientos
  for each row execute function public.tocar_actualizado_en();
create trigger movimientos_bitacora after insert or update or delete on public.movimientos
  for each row execute function public.registrar_bitacora();

alter table public.movimientos enable row level security;
create policy "miembros leen movimientos" on public.movimientos
  for select to authenticated using ((select privado.es_miembro()));
create policy "miembros crean movimientos" on public.movimientos
  for insert to authenticated with check ((select privado.es_miembro()));
create policy "miembros editan movimientos" on public.movimientos
  for update to authenticated using ((select privado.es_miembro())) with check ((select privado.es_miembro()));
create policy "miembros borran movimientos" on public.movimientos
  for delete to authenticated using ((select privado.es_miembro()));

-- ---------------------------------------------------------------------------
-- Facturas: bucket privado (PDF, XML o foto; máx. 5 MB)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('facturas', 'facturas', false, 5242880,
        array['application/pdf', 'application/xml', 'text/xml', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "miembros leen facturas" on storage.objects
  for select to authenticated using (bucket_id = 'facturas' and (select privado.es_miembro()));
create policy "miembros suben facturas" on storage.objects
  for insert to authenticated with check (bucket_id = 'facturas' and (select privado.es_miembro()));
create policy "miembros borran facturas" on storage.objects
  for delete to authenticated using (bucket_id = 'facturas' and (select privado.es_miembro()));

-- ---------------------------------------------------------------------------
-- Generar los movimientos de los recurrentes que ya tocan (se pone al día).
-- ---------------------------------------------------------------------------
create or replace function privado.generar_recurrentes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_hoy date := (now() at time zone 'America/Mexico_City')::date;
  v_fecha date;
  v_total integer := 0;
begin
  for r in select * from public.recurrentes where activo and proxima <= v_hoy for update loop
    v_fecha := r.proxima;
    while v_fecha <= v_hoy loop
      insert into public.movimientos (tipo, concepto, contraparte, categoria, proyecto_id, subtotal, tasa_iva,
                                      estado, fecha, vence, recurrente_id, creado_por)
      values (r.tipo, r.concepto, r.contraparte, r.categoria, r.proyecto_id, r.subtotal, r.tasa_iva,
              'pendiente', v_fecha, v_fecha, r.id, r.creado_por)
      on conflict (recurrente_id, fecha) do nothing;
      v_total := v_total + 1;
      v_fecha := case when r.frecuencia = 'anual' then (v_fecha + interval '1 year')::date
                      else (v_fecha + interval '1 month')::date end;
    end loop;
    update public.recurrentes set proxima = v_fecha where id = r.id;
  end loop;
  return v_total;
end;
$$;
revoke all on function privado.generar_recurrentes() from public, anon, authenticated;

-- Para el panel: al crear o reactivar un recurrente que ya toca, se genera al momento.
create or replace function public.finanzas_generar_recurrentes()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (select privado.es_miembro()) then
    raise exception 'sin permiso';
  end if;
  return privado.generar_recurrentes();
end;
$$;
revoke all on function public.finanzas_generar_recurrentes() from public, anon;
grant execute on function public.finanzas_generar_recurrentes() to authenticated;

-- ---------------------------------------------------------------------------
-- Avisos diarios: cobros y pagos que se vencieron ayer.
-- Llave de preferencia: "finanzas".
-- ---------------------------------------------------------------------------
create or replace function privado.avisar_finanzas()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
  v_ayer date := (now() at time zone 'America/Mexico_City')::date - 1;
  v_total integer := 0;
begin
  for r in
    select id, tipo, concepto, contraparte, total from public.movimientos
    where estado = 'pendiente' and vence = v_ayer
  loop
    perform privado.notificar(
      p.usuario_id,
      case when r.tipo = 'ingreso' then 'finanzas_cobro_vencido' else 'finanzas_pago_vencido' end,
      case when r.tipo = 'ingreso' then 'Cobro vencido' else 'Pago vencido' end,
      r.concepto || coalesce(' · ' || r.contraparte, '') || ' · $' || to_char(r.total, 'FM999,999,990.00'),
      '/finanzas?vista=pendientes')
    from public.perfiles p;
    v_total := v_total + 1;
  end loop;
  return v_total;
end;
$$;
revoke all on function privado.avisar_finanzas() from public, anon, authenticated;

-- 8:15 a. m. CDMX: primero se generan los recurrentes, luego los avisos.
create or replace function privado.finanzas_diario()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform privado.generar_recurrentes();
  perform privado.avisar_finanzas();
end;
$$;
revoke all on function privado.finanzas_diario() from public, anon, authenticated;

select cron.schedule('finanzas-diario', '15 14 * * *', $$select privado.finanzas_diario()$$);
