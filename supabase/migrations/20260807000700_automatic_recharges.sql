alter table public.recargas
  add column if not exists origen text not null default 'manual'
  check (origen in ('manual', 'webhook'));

create table public.recarga_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  provider text not null,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  payload jsonb not null,
  estado text not null default 'recibido' check (estado in ('recibido', 'procesado', 'ignorado', 'error')),
  nota text,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.recarga_webhook_events enable row level security;

create or replace function public.procesar_recarga_webhook(
  p_event_id text,
  p_provider text,
  p_tenant_id uuid,
  p_reference text,
  p_amount numeric,
  p_payload jsonb
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event public.recarga_webhook_events%rowtype;
  v_recharge public.recargas%rowtype;
begin
  if p_event_id is null or p_provider is null or p_reference is null or p_amount <= 0 then
    raise exception 'Evento de recarga inválido';
  end if;

  insert into public.recarga_webhook_events (event_id, provider, tenant_id, payload)
  values (p_event_id, p_provider, p_tenant_id, p_payload)
  on conflict (event_id) do nothing
  returning * into v_event;

  if not found then
    return json_build_object('status', 'duplicate', 'event_id', p_event_id);
  end if;

  select * into v_recharge
  from public.recargas
  where tenant_id = p_tenant_id
    and estado = 'pendiente'
    and referencia = p_reference
    and round(monto, 2) = round(p_amount, 2)
  order by created_at asc
  limit 1
  for update;

  if not found then
    update public.recarga_webhook_events
    set estado = 'ignorado', nota = 'No existe solicitud pendiente con referencia y monto exactos', processed_at = now()
    where id = v_event.id;
    return json_build_object('status', 'ignored', 'event_id', p_event_id);
  end if;

  insert into public.saldos_clientes (tenant_id, user_id, saldo)
  values (v_recharge.tenant_id, v_recharge.user_id, v_recharge.creditos)
  on conflict (tenant_id, user_id) do update
    set saldo = public.saldos_clientes.saldo + excluded.saldo, updated_at = now();

  insert into public.movimientos_saldo (tenant_id, user_id, tipo, monto, referencia_id, nota)
  values (v_recharge.tenant_id, v_recharge.user_id, 'recarga', v_recharge.creditos, v_recharge.id, 'Aprobación automática por webhook');

  update public.recargas
  set estado = 'aprobada', origen = 'webhook', updated_at = now()
  where id = v_recharge.id;

  update public.recarga_webhook_events
  set estado = 'procesado', processed_at = now()
  where id = v_event.id;

  return json_build_object('status', 'processed', 'event_id', p_event_id, 'recarga_id', v_recharge.id);
end;
$$;

revoke all on function public.procesar_recarga_webhook(text, text, uuid, text, numeric, jsonb) from public;
grant execute on function public.procesar_recarga_webhook(text, text, uuid, text, numeric, jsonb) to service_role;
