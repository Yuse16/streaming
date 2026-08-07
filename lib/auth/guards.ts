import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant, type Tenant } from '@/lib/tenant';

async function getAuthenticatedUser() {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return data.user;
}

export async function requireTenantMember(): Promise<{ user: User; tenant: Tenant; membership: { id: string; tenant_id: string; activo: boolean } }> {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const tenant = await getCurrentTenant();
  if (!tenant) redirect('/');

  const supabase = createClient();
  const { data: membership, error } = await supabase
    .from('clientes_tenant')
    .select('id, tenant_id, activo')
    .eq('tenant_id', tenant.id)
    .eq('user_id', user.id)
    .eq('activo', true)
    .maybeSingle();

  if (error || !membership) redirect('/login');
  return { user, tenant, membership };
}

export async function requireTenantAdmin(): Promise<{ user: User; tenant: Tenant }> {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const tenant = await getCurrentTenant();
  if (!tenant) redirect('/');

  const supabase = createClient();
  const [{ data: role }, { data: owner }] = await Promise.all([
    supabase
      .from('user_roles')
      .select('id, rol')
      .eq('tenant_id', tenant.id)
      .eq('user_id', user.id)
      .eq('rol', 'admin_tenant')
      .maybeSingle(),
    supabase
      .from('tenants')
      .select('owner_id')
      .eq('id', tenant.id)
      .maybeSingle()
  ]);

  if (!role && owner?.owner_id !== user.id) redirect('/tienda');
  return { user, tenant };
}

export async function requireSuperadmin(): Promise<{ user: User }> {
  const user = await getAuthenticatedUser();
  if (!user) redirect('/login');

  const supabase = createClient();
  const { data: role, error } = await supabase
    .from('user_roles')
    .select('id, rol')
    .eq('user_id', user.id)
    .is('tenant_id', null)
    .eq('rol', 'superadmin')
    .maybeSingle();

  if (error || !role) redirect('/');
  return { user };
}

export async function requireAdminAccess(): Promise<{ user: User; tenant: Tenant } | { user: User }> {
  const host = headers().get('host')?.split(':')[0].toLowerCase();
  if (host === 'admin.streamish.mx' || host === 'admin.localhost') {
    return requireSuperadmin();
  }
  return requireTenantAdmin();
}
