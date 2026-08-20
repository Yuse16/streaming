create extension if not exists pgcrypto;

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  nombre_tienda text not null,
  logo_url text,
  color_primario text not null default '#06b6d4',
  plan text not null default 'basico',
  activo boolean not null default true,
  comision_pct numeric(5,2) not null default 0.00 check (comision_pct between 0 and 100),
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tenant_id uuid references public.tenants(id) on delete cascade,
  rol text not null check (rol in ('superadmin', 'admin_tenant', 'cliente')),
  created_at timestamptz not null default now(),
  unique (user_id, tenant_id, rol)
);

create table public.tenant_config (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  clabe text,
  banco text,
  titular_cuenta text,
  instrucciones_recarga text,
  ocultar_agotados boolean not null default false,
  creditos_por_peso numeric(10,2) not null default 1.00 check (creditos_por_peso > 0),
  updated_at timestamptz not null default now()
);

create table public.catalogo_servicios (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  slug text unique not null,
  icono_url text,
  activo boolean not null default true
);

create table public.productos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  servicio_id uuid not null references public.catalogo_servicios(id),
  precio numeric(10,2) not null check (precio >= 0),
  estado text not null default 'sin_stock' check (estado in ('activo', 'sin_stock', 'desactivado')),
  desactivado_manualmente boolean not null default false,
  descripcion text,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  unique (tenant_id, servicio_id)
);

create table public.ventas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete restrict,
  producto_id uuid not null references public.productos(id) on delete restrict,
  cuenta_id uuid,
  precio numeric(10,2) not null check (precio >= 0),
  created_at timestamptz not null default now()
);

create table public.inventario_cuentas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  producto_id uuid not null references public.productos(id) on delete cascade,
  correo text not null,
  password_enc text not null,
  vendido boolean not null default false,
  vendido_at timestamptz,
  venta_id uuid references public.ventas(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.ventas
  add constraint ventas_cuenta_id_fkey
  foreign key (cuenta_id) references public.inventario_cuentas(id) on delete restrict;

create unique index idx_inventario_correo_disponible
  on public.inventario_cuentas(tenant_id, producto_id, correo)
  where vendido = false;

create index idx_inventario_disponible
  on public.inventario_cuentas(tenant_id, producto_id, created_at)
  where vendido = false;

create table public.clientes_tenant (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.saldos_clientes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  saldo numeric(10,2) not null default 0 check (saldo >= 0),
  updated_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create table public.movimientos_saldo (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  tipo text not null check (tipo in ('recarga', 'compra', 'reembolso', 'ajuste')),
  monto numeric(10,2) not null check (monto <> 0),
  referencia_id uuid,
  nota text,
  created_at timestamptz not null default now()
);

create table public.recargas (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete restrict,
  monto numeric(10,2) not null check (monto > 0),
  creditos numeric(10,2) not null check (creditos > 0),
  banco_origen text,
  referencia text,
  comprobante_url text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  nota_rechazo text,
  aprobada_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comisiones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  venta_id uuid not null unique references public.ventas(id) on delete cascade,
  pct numeric(5,2) not null check (pct between 0 and 100),
  monto numeric(10,2) not null check (monto >= 0),
  cobrada boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.onboarding_solicitudes (
  id uuid primary key default gen_random_uuid(),
  nombre_comercial text not null,
  slug_deseado text not null check (slug_deseado ~ '^[a-z0-9-]+$'),
  email text not null,
  whatsapp text,
  servicios text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobada', 'rechazada')),
  nota text,
  revisada_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  accion text not null,
  entidad text not null,
  entidad_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_productos_tenant on public.productos(tenant_id, estado);
create index idx_ventas_tenant_created on public.ventas(tenant_id, created_at desc);
create index idx_recargas_tenant_estado on public.recargas(tenant_id, estado, created_at desc);
create index idx_movimientos_user on public.movimientos_saldo(tenant_id, user_id, created_at desc);

insert into public.catalogo_servicios (nombre, slug)
values
  ('Netflix', 'netflix'),
  ('Disney+', 'disney-plus'),
  ('HBO Max', 'hbo-max'),
  ('Paramount+', 'paramount-plus'),
  ('Crunchyroll', 'crunchyroll'),
  ('Star+', 'star-plus')
on conflict (slug) do nothing;

create or replace function public.is_tenant_admin(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = auth.uid()
      and tenant_id = p_tenant_id
      and rol = 'admin_tenant'
  );
$$;

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.clientes_tenant
    where user_id = auth.uid()
      and tenant_id = p_tenant_id
      and activo = true
  );
$$;

create or replace function public.get_inventory_encryption_key()
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_key text;
begin
  execute 'select decrypted_secret from vault.decrypted_secrets where name = ''inventory_encryption_key'' limit 1'
    into v_key;
  if v_key is null or length(v_key) = 0 then
    raise exception 'Falta configurar el secreto inventory_encryption_key en Supabase Vault';
  end if;
  return v_key;
exception when undefined_table then
  raise exception 'Supabase Vault no esta habilitado';
end;
$$;

create or replace function public.update_product_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_product_id uuid := coalesce(new.producto_id, old.producto_id);
  v_tenant_id uuid := coalesce(new.tenant_id, old.tenant_id);
begin
  update public.productos
  set estado = case
    when desactivado_manualmente then 'desactivado'
    when exists (
      select 1 from public.inventario_cuentas
      where producto_id = v_product_id
        and tenant_id = v_tenant_id
        and vendido = false
    ) then 'activo'
    else 'sin_stock'
  end
  where id = v_product_id;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger trg_update_product_status
after insert or update or delete on public.inventario_cuentas
for each row execute function public.update_product_status();

create or replace function public.procesar_compra(
  p_producto_id uuid,
  p_tenant_id uuid,
  p_user_id uuid
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_precio numeric(10,2);
  v_saldo numeric(10,2);
  v_cuenta public.inventario_cuentas%rowtype;
  v_venta_id uuid;
  v_password text;
  v_comision_pct numeric(5,2);
  v_comision numeric(10,2);
begin
  if auth.uid() is null or auth.uid() <> p_user_id then
    raise exception 'Usuario no autorizado';
  end if;

  if not public.is_tenant_member(p_tenant_id) then
    raise exception 'Cliente no pertenece a este tenant';
  end if;

  select precio into v_precio
  from public.productos
  where id = p_producto_id
    and tenant_id = p_tenant_id
    and estado = 'activo';
  if not found then raise exception 'Producto no disponible'; end if;

  select saldo into v_saldo
  from public.saldos_clientes
  where user_id = p_user_id and tenant_id = p_tenant_id
  for update;
  if not found or v_saldo < v_precio then raise exception 'Saldo insuficiente'; end if;

  select * into v_cuenta
  from public.inventario_cuentas
  where producto_id = p_producto_id
    and tenant_id = p_tenant_id
    and vendido = false
  order by created_at asc
  limit 1
  for update skip locked;
  if not found then raise exception 'Sin stock'; end if;

  v_password := pgp_sym_decrypt(v_cuenta.password_enc::bytea, public.get_inventory_encryption_key());

  select comision_pct into v_comision_pct
  from public.tenants
  where id = p_tenant_id;
  v_comision := round(v_precio * (v_comision_pct / 100), 2);

  update public.saldos_clientes
  set saldo = saldo - v_precio, updated_at = now()
  where user_id = p_user_id and tenant_id = p_tenant_id;

  insert into public.ventas (tenant_id, user_id, producto_id, cuenta_id, precio)
  values (p_tenant_id, p_user_id, p_producto_id, v_cuenta.id, v_precio)
  returning id into v_venta_id;

  update public.inventario_cuentas
  set vendido = true, vendido_at = now(), venta_id = v_venta_id
  where id = v_cuenta.id;

  insert into public.comisiones (tenant_id, venta_id, pct, monto)
  values (p_tenant_id, v_venta_id, v_comision_pct, v_comision);

  insert into public.movimientos_saldo (tenant_id, user_id, tipo, monto, referencia_id)
  values (p_tenant_id, p_user_id, 'compra', -v_precio, v_venta_id);

  insert into public.audit_logs (tenant_id, actor_id, accion, entidad, entidad_id)
  values (p_tenant_id, p_user_id, 'compra', 'ventas', v_venta_id);

  return json_build_object(
    'venta_id', v_venta_id,
    'correo', v_cuenta.correo,
    'password', v_password
  );
end;
$$;

create or replace function public.aprobar_recarga(
  p_recarga_id uuid,
  p_admin_id uuid
)
returns public.recargas
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recarga public.recargas%rowtype;
begin
  if auth.uid() is null or auth.uid() <> p_admin_id then
    raise exception 'Usuario no autorizado';
  end if;

  select * into v_recarga from public.recargas where id = p_recarga_id for update;
  if not found then raise exception 'Recarga no encontrada'; end if;
  if not public.is_tenant_admin(v_recarga.tenant_id) then raise exception 'Admin no autorizado'; end if;
  if v_recarga.estado <> 'pendiente' then raise exception 'La recarga ya fue procesada'; end if;

  insert into public.saldos_clientes (tenant_id, user_id, saldo)
  values (v_recarga.tenant_id, v_recarga.user_id, v_recarga.creditos)
  on conflict (tenant_id, user_id) do update
    set saldo = public.saldos_clientes.saldo + excluded.saldo, updated_at = now();

  insert into public.movimientos_saldo (tenant_id, user_id, tipo, monto, referencia_id)
  values (v_recarga.tenant_id, v_recarga.user_id, 'recarga', v_recarga.creditos, v_recarga.id);

  update public.recargas
  set estado = 'aprobada', aprobada_por = p_admin_id, updated_at = now()
  where id = p_recarga_id
  returning * into v_recarga;

  return v_recarga;
end;
$$;

alter table public.tenants enable row level security;
alter table public.user_roles enable row level security;
alter table public.tenant_config enable row level security;
alter table public.catalogo_servicios enable row level security;
alter table public.productos enable row level security;
alter table public.inventario_cuentas enable row level security;
alter table public.clientes_tenant enable row level security;
alter table public.saldos_clientes enable row level security;
alter table public.movimientos_saldo enable row level security;
alter table public.recargas enable row level security;
alter table public.ventas enable row level security;
alter table public.comisiones enable row level security;
alter table public.onboarding_solicitudes enable row level security;
alter table public.audit_logs enable row level security;

create policy tenants_public_read on public.tenants
for select using (activo = true);

create policy tenant_config_public_read on public.tenant_config
for select using (exists (select 1 from public.tenants t where t.id = tenant_id and t.activo = true));

create policy catalogo_public_read on public.catalogo_servicios
for select using (activo = true);

create policy productos_public_read on public.productos
for select using (exists (select 1 from public.tenants t where t.id = tenant_id and t.activo = true));

create policy productos_admin_manage on public.productos
for all using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy inventario_admin_manage on public.inventario_cuentas
for all using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy clientes_own_read on public.clientes_tenant
for select using (user_id = auth.uid() or public.is_tenant_admin(tenant_id));

create policy saldos_own_read on public.saldos_clientes
for select using (user_id = auth.uid() or public.is_tenant_admin(tenant_id));

create policy movimientos_own_read on public.movimientos_saldo
for select using (user_id = auth.uid() or public.is_tenant_admin(tenant_id));

create policy recargas_own_read_insert on public.recargas
for select using (user_id = auth.uid() or public.is_tenant_admin(tenant_id));

create policy recargas_own_insert on public.recargas
for insert with check (user_id = auth.uid() and public.is_tenant_member(tenant_id));

create policy recargas_admin_update on public.recargas
for update using (public.is_tenant_admin(tenant_id)) with check (public.is_tenant_admin(tenant_id));

create policy ventas_own_read on public.ventas
for select using (user_id = auth.uid() or public.is_tenant_admin(tenant_id));

create policy comisiones_admin_read on public.comisiones
for select using (public.is_tenant_admin(tenant_id));

create policy onboarding_public_insert on public.onboarding_solicitudes
for insert with check (true);

create policy audit_admin_read on public.audit_logs
for select using (tenant_id is not null and public.is_tenant_admin(tenant_id));

revoke all on function public.get_inventory_encryption_key() from public;
revoke all on function public.procesar_compra(uuid, uuid, uuid) from public;
grant execute on function public.procesar_compra(uuid, uuid, uuid) to authenticated;
revoke all on function public.aprobar_recarga(uuid, uuid) from public;
grant execute on function public.aprobar_recarga(uuid, uuid) to authenticated;
