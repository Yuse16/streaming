import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidWebhookSignature } from '@/lib/webhook';

export const runtime = 'nodejs';

const webhookSchema = z.object({
  event_id: z.string().min(1).max(200),
  provider: z.string().min(1).max(80),
  tenant_domain: z.string().min(1).max(253),
  reference: z.string().min(1).max(200),
  amount: z.number().positive(),
  paid_at: z.string().datetime().optional()
});

export async function POST(request: Request) {
  const secret = process.env.SPEI_WEBHOOK_SECRET;
  if (!secret) return Response.json({ error: 'Webhook no configurado.' }, { status: 503 });

  const rawBody = await request.text();
  if (!isValidWebhookSignature(rawBody, request.headers.get('x-webhook-signature'), secret)) {
    return Response.json({ error: 'Firma inválida.' }, { status: 401 });
  }

  let parsedBody: unknown;
  try {
    parsedBody = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: 'JSON inválido.' }, { status: 400 });
  }
  const parsed = webhookSchema.safeParse(parsedBody);
  if (!parsed.success) return Response.json({ error: 'Payload inválido.' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('id')
    .eq('custom_domain', parsed.data.tenant_domain.toLowerCase())
    .eq('activo', true)
    .maybeSingle();
  if (tenantError || !tenant) return Response.json({ error: 'Tenant no encontrado.' }, { status: 404 });

  const { data, error } = await supabase.rpc('procesar_recarga_webhook', {
    p_event_id: parsed.data.event_id,
    p_provider: parsed.data.provider,
    p_tenant_id: tenant.id,
    p_reference: parsed.data.reference,
    p_amount: parsed.data.amount,
    p_payload: parsed.data
  });
  if (error) return Response.json({ error: 'No se pudo procesar el webhook.' }, { status: 500 });
  return Response.json(data);
}
