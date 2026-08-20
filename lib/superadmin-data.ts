import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const tenantSchema = z.object({
  id: z.string().uuid(), slug: z.string(), custom_domain: z.string().nullable(), nombre_tienda: z.string(), activo: z.boolean(), plan: z.string(), comision_pct: z.coerce.number(), created_at: z.string(), ventas_total: z.coerce.number(), comisiones_total: z.coerce.number()
});
const onboardingSchema = z.object({ id: z.string().uuid(), nombre_comercial: z.string(), slug_deseado: z.string(), email: z.string().email(), whatsapp: z.string().nullable(), servicios: z.string().nullable(), estado: z.string(), nota: z.string().nullable(), created_at: z.string() });
const catalogSchema = z.object({ id: z.string().uuid(), nombre: z.string(), slug: z.string(), icono_url: z.string().nullable(), activo: z.boolean() });
const commissionSchema = z.object({ tenant_id: z.string().uuid(), tenant_name: z.string(), total: z.coerce.number(), pending: z.coerce.number(), collected: z.coerce.number() });

export type SuperadminTenant = z.infer<typeof tenantSchema>;
export type OnboardingRequest = z.infer<typeof onboardingSchema>;
export type CatalogService = z.infer<typeof catalogSchema>;
export type CommissionSummary = z.infer<typeof commissionSchema>;

export async function getSuperadminTenants(): Promise<SuperadminTenant[]> {
  const { data, error } = await createClient().rpc('superadmin_list_tenants');
  if (error) throw new Error(`No se pudieron cargar los tenants: ${error.message}`);
  return z.array(tenantSchema).parse(data ?? []);
}

export async function getOnboardingRequests(): Promise<OnboardingRequest[]> {
  const { data, error } = await createClient().rpc('superadmin_list_onboarding');
  if (error) throw new Error(`No se pudieron cargar las solicitudes: ${error.message}`);
  return z.array(onboardingSchema).parse(data ?? []);
}

export async function getCatalogServices(): Promise<CatalogService[]> {
  const { data, error } = await createClient().rpc('superadmin_list_catalog');
  if (error) throw new Error(`No se pudo cargar el catálogo: ${error.message}`);
  return z.array(catalogSchema).parse(data ?? []);
}

export async function getCommissionSummaries(): Promise<CommissionSummary[]> {
  const { data, error } = await createClient().rpc('superadmin_list_commissions');
  if (error) throw new Error(`No se pudieron cargar las comisiones: ${error.message}`);
  return z.array(commissionSchema).parse(data ?? []);
}
