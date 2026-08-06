import { headers } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

type Tenant = {
  id: string;
  slug: string;
  nombre_tienda: string;
  logo_url: string | null;
  color_primario: string;
  activo: boolean;
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
