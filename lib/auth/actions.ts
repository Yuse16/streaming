'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSafeNextPath } from '@/lib/auth/redirect';
import { isSuperadminHost } from '@/lib/tenant-host';
import { purchaseResultSchema, type PurchaseResult } from '@/lib/purchase';
import { Resend } from 'resend';
import {
  purchaseSchema,
  profileSchema,
  rechargeSchema,
  balanceAdjustmentSchema,
  rejectRechargeSchema,
  storeConfigSchema,
  vendorInventorySchema,
  vendorProductSchema,
  onboardingSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
  updatePasswordSchema
} from '@/lib/auth/schemas';
import { requireTenantAdmin, requireTenantMember } from '@/lib/auth/guards';
import { getCurrentTenant, getCurrentTenantConfig } from '@/lib/tenant';
import { revalidatePath } from 'next/cache';

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
  const tenant = await getCurrentTenant();
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

  const tenant = await getCurrentTenant();
  if (!tenant) return { error: 'El registro solo está disponible dentro de una tienda.' };
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
  const tenant = await getCurrentTenant();
  if (!tenant) return { error: 'La recuperación solo está disponible dentro de una tienda.' };
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

export async function updateProfileAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = profileSchema.safeParse({ displayName: formData.get('displayName') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ data: { display_name: parsed.data.displayName } });
  if (error) return { error: 'No se pudo actualizar el perfil.' };
  return { success: 'Perfil actualizado.' };
}

export async function changePasswordAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get('password'),
    confirmation: formData.get('confirmation')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: 'No se pudo cambiar la contraseña.' };
  return { success: 'Contraseña actualizada.' };
}

export async function requestRechargeAction(
  _previousState: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const parsed = rechargeSchema.safeParse({
    amount: formData.get('amount'),
    bank: formData.get('bank'),
    reference: formData.get('reference')
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };

  const file = formData.get('receipt');
  if (!(file instanceof File) || file.size === 0) return { error: 'Sube el comprobante de transferencia.' };
  if (file.size > 5 * 1024 * 1024) return { error: 'El comprobante no puede superar 5 MB.' };
  if (!['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)) {
    return { error: 'El comprobante debe ser JPG, PNG, WEBP o PDF.' };
  }

  const { user, tenant } = await requireTenantMember();
  const config = await getCurrentTenantConfig(tenant.id);
  const creditos = Number((parsed.data.amount * (config?.creditos_por_peso ?? 1)).toFixed(2));
  const filename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${user.id}/${tenant.id}/${crypto.randomUUID()}-${filename}`;
  const supabase = createClient();

  const { error: uploadError } = await supabase.storage
    .from('comprobantes')
    .upload(path, file, { contentType: file.type, upsert: false });
  if (uploadError) return { error: 'No se pudo subir el comprobante.' };

  const { error: rechargeError } = await supabase.from('recargas').insert({
    tenant_id: tenant.id,
    user_id: user.id,
    monto: parsed.data.amount,
    creditos,
    banco_origen: parsed.data.bank,
    referencia: parsed.data.reference || null,
    comprobante_url: path,
    estado: 'pendiente'
  });

  if (rechargeError) {
    await supabase.storage.from('comprobantes').remove([path]);
    return { error: 'No se pudo registrar la solicitud de recarga.' };
  }

  return { success: 'Solicitud enviada. Tu vendedor la revisará pronto.' };
}

export async function addInventoryAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = vendorInventorySchema.safeParse({ productId: formData.get('productId'), rawAccounts: formData.get('rawAccounts') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const { tenant } = await requireTenantAdmin();
  const accounts = parsed.data.rawAccounts.split('\n').map((line) => line.trim()).filter(Boolean).map((line) => {
    const separator = line.indexOf(':');
    return separator > 0 ? { correo: line.slice(0, separator).trim(), password: line.slice(separator + 1).trim() } : null;
  });
  if (accounts.some((account) => !account || !/^\S+@\S+\.\S+$/.test(account.correo) || account.password.length < 4)) {
    return { error: 'Cada línea debe tener formato correo:contraseña.' };
  }
  const supabase = createClient();
  const { error } = await supabase.rpc('insertar_inventario_cuentas', { p_tenant_id: tenant.id, p_producto_id: parsed.data.productId, p_cuentas: accounts });
  if (error) return { error: 'No se pudieron cargar las cuentas.' };
  revalidatePath('/admin/inventario');
  return { success: 'Cuentas agregadas al inventario.' };
}

export async function toggleProductAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = vendorProductSchema.safeParse({ productId: formData.get('productId') });
  if (!parsed.success) return { error: 'Producto inválido.' };
  const { tenant } = await requireTenantAdmin();
  const supabase = createClient();
  const { data: product, error: productError } = await supabase.from('productos').select('desactivado_manualmente').eq('id', parsed.data.productId).eq('tenant_id', tenant.id).maybeSingle();
  if (productError || !product) return { error: 'Producto no encontrado.' };
  const nextManualState = !product.desactivado_manualmente;
  const { count, error: stockError } = await supabase.from('inventario_cuentas').select('id', { count: 'exact', head: true }).eq('producto_id', parsed.data.productId).eq('tenant_id', tenant.id).eq('vendido', false);
  if (stockError) return { error: 'No se pudo consultar el stock.' };
  const { error } = await supabase.from('productos').update({ desactivado_manualmente: nextManualState, estado: nextManualState ? 'desactivado' : (count && count > 0 ? 'activo' : 'sin_stock') }).eq('id', parsed.data.productId).eq('tenant_id', tenant.id);
  if (error) return { error: 'No se pudo actualizar el producto.' };
  revalidatePath('/admin/inventario');
  return { success: 'Producto actualizado.' };
}

export async function approveRechargeAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = vendorProductSchema.pick({ productId: true }).safeParse({ productId: formData.get('rechargeId') });
  if (!parsed.success) return { error: 'Recarga inválida.' };
  const { user } = await requireTenantAdmin();
  const { error } = await createClient().rpc('aprobar_recarga', { p_recarga_id: parsed.data.productId, p_admin_id: user.id });
  if (error) return { error: 'No se pudo aprobar la recarga.' };
  revalidatePath('/admin/recargas');
  return { success: 'Recarga aprobada.' };
}

export async function rejectRechargeAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = rejectRechargeSchema.safeParse({ rechargeId: formData.get('rechargeId'), note: formData.get('note') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const { user } = await requireTenantAdmin();
  const { error } = await createClient().rpc('rechazar_recarga', { p_recarga_id: parsed.data.rechargeId, p_admin_id: user.id, p_nota: parsed.data.note });
  if (error) return { error: 'No se pudo rechazar la recarga.' };
  revalidatePath('/admin/recargas');
  return { success: 'Recarga rechazada.' };
}

export async function adjustClientBalanceAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = balanceAdjustmentSchema.safeParse({ userId: formData.get('userId'), credits: formData.get('credits'), note: formData.get('note') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const { user, tenant } = await requireTenantAdmin();
  const { error } = await createClient().rpc('ajustar_saldo', { p_tenant_id: tenant.id, p_user_id: parsed.data.userId, p_creditos: parsed.data.credits, p_nota: parsed.data.note, p_admin_id: user.id });
  if (error) return { error: 'No se pudo ajustar el saldo.' };
  revalidatePath('/admin/clientes');
  return { success: 'Saldo actualizado.' };
}

export async function updateStoreConfigAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = storeConfigSchema.safeParse({ storeName: formData.get('storeName'), primaryColor: formData.get('primaryColor'), logoUrl: formData.get('logoUrl'), bank: formData.get('bank'), clabe: formData.get('clabe'), accountHolder: formData.get('accountHolder'), rechargeInstructions: formData.get('rechargeInstructions') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const { tenant } = await requireTenantAdmin();
  const supabase = createClient();
  const { error: tenantError } = await supabase.from('tenants').update({ nombre_tienda: parsed.data.storeName, color_primario: parsed.data.primaryColor, logo_url: parsed.data.logoUrl || null }).eq('id', tenant.id);
  const { error: configError } = await supabase.from('tenant_config').upsert({ tenant_id: tenant.id, banco: parsed.data.bank || null, clabe: parsed.data.clabe || null, titular_cuenta: parsed.data.accountHolder || null, instrucciones_recarga: parsed.data.rechargeInstructions || null });
  if (tenantError || configError) return { error: 'No se pudo guardar la configuración.' };
  revalidatePath('/', 'layout');
  return { success: 'Configuración guardada.' };
}

export async function requestOnboardingAction(_previousState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = onboardingSchema.safeParse({ commercialName: formData.get('commercialName'), desiredSlug: formData.get('desiredSlug'), email: formData.get('email'), whatsapp: formData.get('whatsapp'), services: formData.get('services') });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  const { error } = await createClient().from('onboarding_solicitudes').insert({ nombre_comercial: parsed.data.commercialName, slug_deseado: parsed.data.desiredSlug, email: parsed.data.email, whatsapp: parsed.data.whatsapp || null, servicios: parsed.data.services || null, estado: 'pendiente' });
  if (error) return { error: 'No se pudo enviar la solicitud.' };
  return { success: 'Solicitud enviada. Revisaremos tus datos y te contactaremos.' };
}
