import { z } from 'zod';

export const purchaseResultSchema = z.object({
  venta_id: z.string().uuid(),
  correo: z.string().email(),
  password: z.string().min(1)
});

export type PurchaseResult = z.infer<typeof purchaseResultSchema>;
