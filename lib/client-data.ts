import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const purchaseHistorySchema = z.object({
  venta_id: z.string().uuid(),
  servicio: z.string(),
  correo: z.string().email(),
  password: z.string().min(1),
  precio: z.coerce.number().nonnegative(),
  created_at: z.string()
});

const rechargeSchema = z.object({
  id: z.string().uuid(),
  monto: z.coerce.number().positive(),
  creditos: z.coerce.number().positive(),
  banco_origen: z.string().nullable(),
  referencia: z.string().nullable(),
  comprobante_url: z.string().nullable(),
  estado: z.enum(['pendiente', 'aprobada', 'rechazada']),
  nota_rechazo: z.string().nullable(),
  created_at: z.string()
});

export type PurchaseHistoryItem = z.infer<typeof purchaseHistorySchema>;
export type RechargeRequest = z.infer<typeof rechargeSchema>;

export async function getPurchaseHistory(tenantId: string): Promise<PurchaseHistoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc('obtener_mis_compras', { p_tenant_id: tenantId });
  if (error) throw new Error(`No se pudo cargar el historial: ${error.message}`);
  return z.array(purchaseHistorySchema).parse(data ?? []);
}

export async function getRechargeHistory(tenantId: string, userId: string): Promise<RechargeRequest[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('recargas')
    .select('id, monto, creditos, banco_origen, referencia, comprobante_url, estado, nota_rechazo, created_at')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`No se pudo cargar las recargas: ${error.message}`);
  return z.array(rechargeSchema).parse(data ?? []);
}
