-- Lista de correos con acceso al panel (Jorge y Antonio).
-- Al crearse una cuenta en Auth con uno de estos correos, se crea su perfil
-- automáticamente. Cualquier otra cuenta queda sin perfil = sin acceso.
create table privado.correos_permitidos (
  correo text primary key check (correo = lower(correo)),
  nombre text not null,
  color  text not null default '#2563EB'
);

revoke all on privado.correos_permitidos from public, anon, authenticated;

create or replace function privado.crear_perfil_si_permitido()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v privado.correos_permitidos%rowtype;
begin
  select * into v from privado.correos_permitidos where correo = lower(new.email);
  if found then
    insert into public.perfiles (usuario_id, nombre, correo, color, creado_por)
    values (new.id, v.nombre, lower(new.email), v.color, new.id)
    on conflict (usuario_id) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function privado.crear_perfil_si_permitido() from public, anon, authenticated;

create trigger al_crear_usuario_crear_perfil
  after insert on auth.users
  for each row execute function privado.crear_perfil_si_permitido();
