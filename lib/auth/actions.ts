'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSafeNextPath } from '@/lib/auth/redirect';
import { getTenantSlug, isSuperadminHost } from '@/lib/tenant-host';
import { purchaseResultSchema, type PurchaseResult } from '@/lib/purchase';
import { Resend } from 'resend';
import {
  purchaseSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema
} from '@/lib/auth/schemas';
import { requireTenantMember } from '@/lib/auth/guards';

export type AuthActionState = {
  error?: string;
  success?: string;
};

export type PurchaseActionState = {
  error?: string;
  purchase?: PurchaseResult;
};

function getOrigin(): string {
  const requestHeaders = headers();
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  if (!host) throw new Error('No se pudo determinar el host de la solicitud.');
  return `${protocol}://${host}`;
}

function getRequestTenantSlug(): string | null {
  const requestHeaders = headers();
  return requestHeaders.get('x-tenant-slug') ?? getTenantSlug(requestHeaders.get('host') ?? '');
}

async function getActiveTenant(tenantSlug: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('tenants')
    .select('id, slug, activo')
    .eq('slug', tenantSlug)
    .eq('activo', true)
    .maybeSingle();

  if (error) throw new Error(`No se pudo validar la tienda: ${error.message}`);
  return data;
}

export async function signInAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next')
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const requestHeaders = headers();
  const superadmin = isSuperadminHost(requestHeaders.get('host') ?? '');
  const tenantSlug = getRequestTenantSlug();
  const tenant = tenantSlug ? await getActiveTenant(tenantSlug) : null;
  if (!superadmin && !tenant) return { error: 'La tienda no está disponible.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) return { error: 'Email o contraseña incorrectos.' };

  if (superadmin) {
    const { data: role, error: roleError } = await supabase
      .from('user_roles')
      .select('id')
      .eq('user_id', data.user.id)
      .is('tenant_id', null)
      .eq('rol', 'superadmin')
      .maybeSingle();

    if (roleError || !role) {
      await supabase.auth.signOut();
      return { error: 'No tienes permisos de superadmin.' };
    }
    redirect(getSafeNextPath(parsed.data.next, '/admin'));
  }

  if (!tenant) return { error: 'La tienda no está disponible.' };

  const { data: membership, error: membershipError } = await supabase
    .from('clientes_tenant')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('user_id', data.user.id)
    .eq('activo', true)
    .maybeSingle();

  if (membershipError || !membership) {
    await supabase.auth.signOut();
    return { error: 'Tu cuenta no pertenece a esta tienda.' };
  }

  redirect(getSafeNextPath(parsed.data.next));
}

export async function signUpAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password')
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const tenantSlug = getRequestTenantSlug();
  if (!tenantSlug) return { error: 'El registro solo está disponible dentro de una tienda.' };
  const tenant = await getActiveTenant(tenantSlug);
  if (!tenant) return { error: 'La tienda no está disponible.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        display_name: parsed.data.name,
        tenant_id: tenant.id,
        tenant_slug: tenant.slug
      },
      emailRedirectTo: `${getOrigin()}/actualizar-password`
    }
  });

  if (error) return { error: error.message };
  if (data.session) redirect('/tienda');

  return { success: 'Cuenta creada. Revisa tu email para confirmar el registro.' };
}

export async function requestPasswordResetAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get('email')
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const tenantSlug = getRequestTenantSlug();
  if (!tenantSlug) return { error: 'La recuperación solo está disponible dentro de una tienda.' };
  const tenant = await getActiveTenant(tenantSlug);
  if (!tenant) return { error: 'La tienda no está disponible.' };

  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${getOrigin()}/actualizar-password`
  });

  if (error) return { error: 'No se pudo enviar el correo de recuperación.' };
  return { success: 'Si el email existe, recibirás instrucciones de recuperación.' };
}

export async function updatePasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmation: formData.get('confirmation')
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Tu enlace de recuperación no es válido o ya expiró.' };

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: 'No se pudo actualizar la contraseña.' };
  return { success: 'Contraseña actualizada. Ya puedes iniciar sesión.' };
}

async function sendPurchaseEmail(email: string | undefined, productName: string, purchase: PurchaseResult): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from || !email) return;

  const resend = new Resend(apiKey);
  await resend.emails.send({
    from,
    to: email,
    subject: `Credenciales de tu compra: ${productName}`,
    text: `Tu compra fue exitosa.\n\nServicio: ${productName}\nCorreo: ${purchase.correo}\nContraseña: ${purchase.password}`
  });
}

export async function purchaseAccountAction(
  _previousState: PurchaseActionState,
  formData: FormData
): Promise<PurchaseActionState> {
  const parsed = purchaseSchema.safeParse({ productId: formData.get('productId') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Producto inválido.' };

  const { user, tenant } = await requireTenantMember();
  const supabase = createClient();
  const { data, error } = await supabase.rpc('procesar_compra', {
    p_producto_id: parsed.data.productId,
    p_tenant_id: tenant.id,
    p_user_id: user.id
  });

  if (error) {
    if (error.message.includes('Saldo insuficiente')) return { error: 'No tienes créditos suficientes. Recarga aquí.' };
    if (error.message.includes('Sin stock') || error.message.includes('no disponible')) return { error: 'Este producto ya no está disponible.' };
    return { error: 'No se pudo completar la compra. Tu saldo no fue afectado.' };
  }

  const purchase = purchaseResultSchema.safeParse(data);
  if (!purchase.success) return { error: 'La compra se completó, pero no se pudo preparar la entrega.' };

  try {
    await sendPurchaseEmail(user.email, 'tu cuenta digital', purchase.data);
  } catch {
    // La entrega por email no puede deshacer una compra ya confirmada por el RPC.
  }
  return { purchase: purchase.data };
}
