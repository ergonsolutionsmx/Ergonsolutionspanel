-- Si algún día se elimina una cuenta, sus registros se conservan y
-- "creado_por" queda vacío (antes bloqueaba la eliminación).
alter table public.perfiles drop constraint perfiles_creado_por_fkey,
  add constraint perfiles_creado_por_fkey foreign key (creado_por) references auth.users (id) on delete set null;

alter table public.notificaciones drop constraint notificaciones_creado_por_fkey,
  add constraint notificaciones_creado_por_fkey foreign key (creado_por) references auth.users (id) on delete set null;
