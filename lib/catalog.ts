import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { getCurrentTenant } from '@/lib/tenant';

const productSchema = z.object({
  id: z.string().uuid(),
  precio: z.coerce.number().nonnegative(),
  estado: z.enum(['activo', 'sin_stock', 'desactivado']),
  descripcion: z.string().nullable(),
  orden: z.number().int(),
  catalogo_servicios: z.object({
    id: z.string().uuid(),
    nombre: z.string(),
    icono_url: z.string().nullable()
  })
});

export type CatalogProduct = z.infer<typeof productSchema>;

export async function getActiveProducts(): Promise<{ products: CatalogProduct[]; tenantId: string | null }> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { products: [], tenantId: null };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('productos')
    .select('id, precio, estado, descripcion, orden, catalogo_servicios(id, nombre, icono_url)')
    .eq('tenant_id', tenant.id)
    .eq('estado', 'activo')
    .order('orden', { ascending: true });

  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  return { products: z.array(productSchema).parse(data ?? []), tenantId: tenant.id };
}

export async function getProduct(productId: string): Promise<CatalogProduct | null> {
  const tenant = await getCurrentTenant();
  if (!tenant) return null;

  const supabase = createClient();
  const { data, error } = await supabase
    .from('productos')
    .select('id, precio, estado, descripcion, orden, catalogo_servicios(id, nombre, icono_url)')
    .eq('id', productId)
    .eq('tenant_id', tenant.id)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el producto: ${error.message}`);
  return data ? productSchema.parse(data) : null;
}
