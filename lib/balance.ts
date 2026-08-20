import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const balanceSchema = z.object({ saldo: z.coerce.number().nonnegative() });

export async function getTenantBalance(tenantId: string, userId: string): Promise<number> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('saldos_clientes')
    .select('saldo')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new Error(`No se pudo cargar el saldo: ${error.message}`);
  return data ? balanceSchema.parse(data).saldo : 0;
}
