import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const productSchema = z.object({
  id: z.string().uuid(),
  precio: z.coerce.number().nonnegative(),
  estado: z.enum(['activo', 'sin_stock', 'desactivado']),
  desactivado_manualmente: z.boolean(),
  descripcion: z.string().nullable(),
  catalogo_servicios: z.object({ nombre: z.string(), icono_url: z.string().nullable() }),
  inventario_cuentas: z.array(z.object({ id: z.string().uuid(), vendido: z.boolean() }))
});

const rechargeSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  monto: z.coerce.number(),
  creditos: z.coerce.number(),
  banco_origen: z.string().nullable(),
  referencia: z.string().nullable(),
  comprobante_url: z.string().nullable(),
  estado: z.string(),
  created_at: z.string()
});

const saleSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  precio: z.coerce.number(),
  created_at: z.string(),
  productos: z.union([
    z.object({ catalogo_servicios: z.object({ nombre: z.string() }).nullable() }).nullable(),
    z.array(z.unknown())
  ])
});

export type VendorProduct = z.infer<typeof productSchema> & { stock: number };
export type VendorRecharge = z.infer<typeof rechargeSchema>;

export async function getVendorProducts(tenantId: string): Promise<VendorProduct[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('productos')
    .select('id, precio, estado, desactivado_manualmente, descripcion, catalogo_servicios(nombre, icono_url), inventario_cuentas(id, vendido)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: true });
  if (error) throw new Error(`No se pudo cargar el inventario: ${error.message}`);

  return z.array(productSchema).parse(data ?? []).map((product) => ({
    ...product,
    stock: product.inventario_cuentas.filter((account) => !account.vendido).length
  }));
}

export async function getPendingRecharges(tenantId: string): Promise<VendorRecharge[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recargas')
    .select('id, user_id, monto, creditos, banco_origen, referencia, comprobante_url, estado, created_at')
    .eq('tenant_id', tenantId)
    .eq('estado', 'pendiente')
    .order('created_at', { ascending: false });
  if (error) throw new Error(`No se pudieron cargar las recargas: ${error.message}`);
  return z.array(rechargeSchema).parse(data ?? []);
}

export async function getVendorClients(tenantId: string) {
  const supabase = createClient();
  const [{ data: clients, error: clientsError }, { data: balances, error: balancesError }] = await Promise.all([
    supabase.from('clientes_tenant').select('id, user_id, activo, created_at').eq('tenant_id', tenantId).order('created_at', { ascending: false }),
    supabase.from('saldos_clientes').select('user_id, saldo').eq('tenant_id', tenantId)
  ]);
  if (clientsError || balancesError) throw new Error('No se pudieron cargar los clientes.');
  const balanceMap = new Map((balances ?? []).map((balance) => [balance.user_id, Number(balance.saldo)]));
  return (clients ?? []).map((client) => ({ ...client, saldo: balanceMap.get(client.user_id) ?? 0 }));
}

export async function getVendorSales(tenantId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('ventas')
    .select('id, user_id, precio, created_at, productos(catalogo_servicios(nombre))')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(`No se pudieron cargar las ventas: ${error.message}`);
  return z.array(saleSchema).parse(data ?? []);
}
