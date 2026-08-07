'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSafeNextPath } from '@/lib/auth/redirect';
import {
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema
} from '@/lib/auth/schemas';

export type AuthActionState = {
  error?: string;
  success?: string;
};

function getOrigin(): string {
  const requestHeaders = headers();
  const host = requestHeaders.get('host');
  const protocol = requestHeaders.get('x-forwarded-proto') ?? 'http';
  if (!host) throw new Error('No se pudo determinar el host de la solicitud.');
  return `${protocol}://${host}`;
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

  const tenantSlug = formData.get('tenantSlug');
  if (typeof tenantSlug !== 'string' || !tenantSlug) return { error: 'No se pudo identificar la tienda.' };
  const tenant = await getActiveTenant(tenantSlug);
  if (!tenant) return { error: 'La tienda no está disponible.' };

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error || !data.user) return { error: 'Email o contraseña incorrectos.' };

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
    password: formData.get('password'),
    tenantSlug: formData.get('tenantSlug')
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const tenant = await getActiveTenant(parsed.data.tenantSlug);
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
    email: formData.get('email'),
    tenantSlug: formData.get('tenantSlug')
  });

  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const tenant = await getActiveTenant(parsed.data.tenantSlug);
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
