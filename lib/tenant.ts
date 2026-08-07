import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export type Tenant = {
  id: string;
  slug: string;
  nombre_tienda: string;
  logo_url: string | null;
  color_primario: string;
  activo: boolean;
};

export type TenantConfig = {
  clabe: string | null;
  banco: string | null;
  titular_cuenta: string | null;
  instrucciones_recarga: string | null;
  ocultar_agotados: boolean;
  creditos_por_peso: number;
};

export async function getCurrentTenant(): Promise<Tenant | null> {
  const slug = headers().get('x-tenant-slug');
  if (!slug) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, nombre_tienda, logo_url, color_primario, activo')
    .eq('slug', slug)
    .eq('activo', true)
    .maybeSingle();

  if (error) throw new Error(`No se pudo resolver el tenant: ${error.message}`);
  return data;
}

export async function getCurrentTenantConfig(tenantId: string): Promise<TenantConfig | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tenant_config')
    .select('clabe, banco, titular_cuenta, instrucciones_recarga, ocultar_agotados, creditos_por_peso')
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar la configuración de la tienda: ${error.message}`);
  return data;
}
