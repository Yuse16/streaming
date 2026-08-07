'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { requireSuperadmin } from '@/lib/auth/guards';

export type SuperadminActionState = { error?: string; success?: string };
const tenantUpdateSchema = z.object({ tenantId: z.string().uuid(), active: z.enum(['true', 'false']), commission: z.coerce.number().min(0).max(100), domain: z.string().trim().max(253) });
const onboardingReviewSchema = z.object({ requestId: z.string().uuid(), status: z.enum(['aprobada', 'rechazada']), note: z.string().trim().max(500) });
const catalogSchema = z.object({ id: z.string().uuid().optional(), name: z.string().trim().min(2).max(80), slug: z.string().trim().regex(/^[a-z0-9-]+$/), iconUrl: z.string().url().or(z.literal('')), active: z.enum(['true', 'false']) });
const commissionSchema = z.object({ tenantId: z.string().uuid() });

async function addDomainToVercel(domain: string): Promise<boolean> {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId || !domain) return true;
  const response = await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: domain }) });
  return response.ok || response.status === 409;
}

export async function updateTenantAction(_state: SuperadminActionState, formData: FormData): Promise<SuperadminActionState> {
  await requireSuperadmin();
  const parsed = tenantUpdateSchema.safeParse({ tenantId: formData.get('tenantId'), active: formData.get('active'), commission: formData.get('commission'), domain: formData.get('domain') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  if (parsed.data.domain && !(await addDomainToVercel(parsed.data.domain))) return { error: 'No se pudo registrar el dominio en Vercel.' };
  const { error } = await createClient().rpc('superadmin_update_tenant', { p_tenant_id: parsed.data.tenantId, p_activo: parsed.data.active === 'true', p_comision_pct: parsed.data.commission, p_custom_domain: parsed.data.domain });
  if (error) return { error: 'No se pudo actualizar el tenant.' };
  revalidatePath('/admin/tenants');
  return { success: 'Tenant actualizado.' };
}

export async function reviewOnboardingAction(_state: SuperadminActionState, formData: FormData): Promise<SuperadminActionState> {
  await requireSuperadmin();
  const parsed = onboardingReviewSchema.safeParse({ requestId: formData.get('requestId'), status: formData.get('status'), note: formData.get('note') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const { error } = await createClient().rpc('superadmin_review_onboarding', { p_request_id: parsed.data.requestId, p_estado: parsed.data.status, p_nota: parsed.data.note });
  if (error) return { error: 'No se pudo revisar la solicitud.' };
  revalidatePath('/admin/onboarding');
  return { success: 'Solicitud procesada.' };
}

export async function upsertCatalogAction(_state: SuperadminActionState, formData: FormData): Promise<SuperadminActionState> {
  await requireSuperadmin();
  const parsed = catalogSchema.safeParse({ id: formData.get('id') || undefined, name: formData.get('name'), slug: formData.get('slug'), iconUrl: formData.get('iconUrl'), active: formData.get('active') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const { error } = await createClient().rpc('superadmin_upsert_catalog', { p_id: parsed.data.id ?? null, p_nombre: parsed.data.name, p_slug: parsed.data.slug, p_icono_url: parsed.data.iconUrl, p_activo: parsed.data.active === 'true' });
  if (error) return { error: 'No se pudo guardar el servicio.' };
  revalidatePath('/admin/catalogo');
  return { success: 'Servicio guardado.' };
}

export async function markCommissionsCollectedAction(_state: SuperadminActionState, formData: FormData): Promise<SuperadminActionState> {
  await requireSuperadmin();
  const parsed = commissionSchema.safeParse({ tenantId: formData.get('tenantId') });
  if (!parsed.success) return { error: 'Tenant inválido.' };
  const { error } = await createClient().rpc('superadmin_mark_commissions_collected', { p_tenant_id: parsed.data.tenantId });
  if (error) return { error: 'No se pudieron marcar las comisiones.' };
  revalidatePath('/admin/comisiones');
  return { success: 'Comisiones marcadas como cobradas.' };
}
