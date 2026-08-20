# Schema de Base de Datos — Supabase (Postgres)

## Diagrama de relaciones

```
auth.users (Supabase built-in)
    │
    ├── user_roles (rol: superadmin | admin_tenant | cliente)
    │
tenants
    ├── tenant_config
    ├── productos
    │       └── inventario_cuentas
    ├── clientes_tenant (vincula auth.user con tenant)
    ├── saldos_clientes
    ├── movimientos_saldo
    ├── recargas
    ├── ventas
    │       └── comisiones
    └── recargas
```

---

## Tablas

### `tenants`
```sql
create table tenants (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  custom_domain text unique,
  nombre_tienda text not null,
  logo_url      text,
  color_primario text default '#6366f1',
  plan          text default 'basico',
  activo        boolean default true,
   comision_pct  numeric(5,2) default 0.00,
  owner_id      uuid references auth.users(id),
  created_at    timestamptz default now()
);
```

### `user_roles`
```sql
create table user_roles (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users(id) on delete cascade,
  tenant_id  uuid references tenants(id) on delete cascade,
  rol        text not null, -- superadmin | admin_tenant | cliente
  created_at timestamptz default now(),
  unique(user_id, tenant_id, rol)
);
```

El rol `superadmin` usa `tenant_id = null`. Los co-admins son usuarios con
`rol = 'admin_tenant'` asociados al mismo tenant.

### `tenant_config`
```sql
create table tenant_config (
  id            uuid primary key default gen_random_uuid(),
  tenant_id     uuid references tenants(id) on delete cascade,
  clabe         text,
  banco         text,
  titular_cuenta text,
  instrucciones_recarga text,
  ocultar_agotados boolean default false,
  creditos_por_peso numeric(5,2) default 1.00,
  updated_at    timestamptz default now()
);
```

### `catalogo_servicios` (tabla global del superadmin)
```sql
create table catalogo_servicios (
  id       uuid primary key default gen_random_uuid(),
  nombre   text not null,
  slug     text unique not null,
  icono_url text,
  activo   boolean default true
);
-- Datos: Netflix, Disney+, HBO Max, Paramount+, etc.
```

### `productos` (por tenant)
```sql
create table productos (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid references tenants(id) on delete cascade,
  servicio_id     uuid references catalogo_servicios(id),
  precio          numeric(10,2) not null,
  estado          text default 'sin_stock',
  -- estado: activo | sin_stock | desactivado
  desactivado_manualmente boolean default false,
  descripcion     text,
  orden           int default 0,
  created_at      timestamptz default now()
);
```

### `inventario_cuentas`
```sql
create table inventario_cuentas (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references tenants(id),
  producto_id  uuid references productos(id),
  correo       text not null,
  password_enc text not null,  -- pgcrypto: pgp_sym_encrypt(pass, key)
  vendido      boolean default false,
  vendido_at   timestamptz,
  venta_id     uuid,
  created_at   timestamptz default now()
);

create index idx_inventario_disponible
  on inventario_cuentas(tenant_id, producto_id, vendido)
  where vendido = false;
```

### `clientes_tenant`
```sql
create table clientes_tenant (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references tenants(id),
  user_id    uuid references auth.users(id),
  activo     boolean default true,
  created_at timestamptz default now(),
  unique(tenant_id, user_id)
);
```

### `saldos_clientes`
```sql
create table saldos_clientes (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid references tenants(id),
  user_id    uuid references auth.users(id),
  saldo      numeric(10,2) default 0 check (saldo >= 0),
  updated_at timestamptz default now(),
  unique(tenant_id, user_id)
);
```

### `movimientos_saldo`
```sql
create table movimientos_saldo (
  id             uuid primary key default gen_random_uuid(),
  tenant_id      uuid references tenants(id),
  user_id        uuid references auth.users(id),
  tipo           text not null,  -- recarga | compra | reembolso | ajuste
  monto          numeric(10,2) not null,  -- + entrada, - salida
  referencia_id  uuid,
  nota           text,
  created_at     timestamptz default now()
);
```

### `recargas`
```sql
create table recargas (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid references tenants(id),
  user_id          uuid references auth.users(id),
  monto            numeric(10,2) not null,
  creditos         numeric(10,2) not null,
  banco_origen     text,
  referencia       text,
  comprobante_url  text,
  estado           text default 'pendiente',  -- pendiente | aprobada | rechazada
  nota_rechazo     text,
  aprobada_por     uuid references auth.users(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
```

### `ventas`
```sql
create table ventas (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid references tenants(id),
  user_id      uuid references auth.users(id),
  producto_id  uuid references productos(id),
  cuenta_id    uuid references inventario_cuentas(id),
  precio       numeric(10,2) not null,
  created_at   timestamptz default now()
);
```

### `comisiones`
```sql
create table comisiones (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id),
  venta_id    uuid references ventas(id),
  pct         numeric(5,2) not null,
  monto       numeric(10,2) not null,
  cobrada     boolean default false,
  created_at  timestamptz default now()
);
```

### `onboarding_solicitudes`
```sql
create table onboarding_solicitudes (
  id                uuid primary key default gen_random_uuid(),
  nombre_comercial  text not null,
  slug_deseado      text not null,
  email             text not null,
  whatsapp          text,
  servicios         text,
  estado            text default 'pendiente', -- pendiente | aprobada | rechazada
  nota              text,
  revisada_por      uuid references auth.users(id),
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
```

### `audit_logs`
```sql
create table audit_logs (
  id          uuid primary key default gen_random_uuid(),
  tenant_id   uuid references tenants(id) on delete set null,
  actor_id    uuid references auth.users(id),
  accion      text not null,
  entidad     text not null,
  entidad_id  uuid,
  metadata    jsonb,
  created_at  timestamptz default now()
);
```

---

## Row Level Security (RLS)

### Regla base para tablas con `tenant_id`
```sql
-- Ejemplo para `productos`
alter table productos enable row level security;

-- Clientes del tenant solo ven productos de su tenant
create policy "cliente_ve_su_tenant" on productos
  for select using (
    tenant_id = (
      select tenant_id from clientes_tenant
      where user_id = auth.uid() limit 1
    )
  );

-- Admin tenant solo gestiona su propio tenant
create policy "admin_gestiona_su_tenant" on productos
  for all using (
    tenant_id = (
      select id from tenants where owner_id = auth.uid() limit 1
    )
  );
```

### Superadmin bypasea RLS
```sql
-- El superadmin usa service_role key, que bypasea RLS
-- Nunca exponer service_role key en el cliente
```

---

## Función RPC: procesar_compra

La función `get_inventory_encryption_key()` debe leer el secreto
`inventory_encryption_key` desde Supabase Vault. Crear ese secreto manualmente
en el proyecto de Supabase antes de ejecutar compras; su valor nunca debe estar
en Git ni en el cliente.

```sql
create or replace function get_inventory_encryption_key()
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret
  from vault.decrypted_secrets
  where name = 'inventory_encryption_key'
  limit 1;
$$;
```

```sql
create or replace function procesar_compra(
  p_producto_id uuid,
  p_tenant_id uuid,
  p_user_id uuid
) returns json as $$
declare
  v_precio numeric;
  v_saldo numeric;
  v_cuenta record;
  v_venta_id uuid;
  v_password text;
  v_comision_pct numeric;
  v_comision numeric;
begin
  -- 1. Obtener precio del producto
  select precio into v_precio from productos
  where id = p_producto_id and tenant_id = p_tenant_id and estado = 'activo';
  if not found then raise exception 'Producto no disponible'; end if;

  -- 2. Verificar saldo
  select saldo into v_saldo from saldos_clientes
  where user_id = p_user_id and tenant_id = p_tenant_id for update;
  if v_saldo < v_precio then raise exception 'Saldo insuficiente'; end if;

  -- 3. Tomar cuenta (FIFO, lock para evitar duplicados)
   select * into v_cuenta from inventario_cuentas
  where producto_id = p_producto_id and tenant_id = p_tenant_id and vendido = false
  order by created_at asc limit 1 for update skip locked;
  if not found then raise exception 'Sin stock'; end if;

  -- 4. Descifrar contraseña
   -- La clave se obtiene desde un secreto configurado en Supabase Vault;
   -- nunca se incluye en migraciones, código cliente ni variables públicas.
   v_password := pgp_sym_decrypt(v_cuenta.password_enc::bytea, get_inventory_encryption_key());

  -- 5. Descontar saldo
  update saldos_clientes set saldo = saldo - v_precio
  where user_id = p_user_id and tenant_id = p_tenant_id;

  -- 6. Insertar venta
  insert into ventas(tenant_id, user_id, producto_id, cuenta_id, precio)
  values(p_tenant_id, p_user_id, p_producto_id, v_cuenta.id, v_precio)
  returning id into v_venta_id;

  -- 7. Marcar cuenta vendida
  update inventario_cuentas set vendido = true, vendido_at = now(), venta_id = v_venta_id
  where id = v_cuenta.id;

  -- 8. Calcular y registrar comisión
  select comision_pct into v_comision_pct from tenants where id = p_tenant_id;
  v_comision := v_precio * (v_comision_pct / 100);
  insert into comisiones(tenant_id, venta_id, pct, monto)
  values(p_tenant_id, v_venta_id, v_comision_pct, v_comision);

  -- 9. Registrar movimiento
  insert into movimientos_saldo(tenant_id, user_id, tipo, monto, referencia_id)
  values(p_tenant_id, p_user_id, 'compra', -v_precio, v_venta_id);

  return json_build_object(
    'venta_id', v_venta_id,
    'correo', v_cuenta.correo,
    'password', v_password
  );
end;
$$ language plpgsql security definer;
```
