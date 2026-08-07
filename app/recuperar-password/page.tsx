import { headers } from 'next/headers';
import { AuthShell } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/auth-form';
import { requestPasswordResetAction } from '@/lib/auth/actions';
import { getTenantSlug } from '@/lib/tenant-host';

export default function RecoverPasswordPage() {
  const tenantSlug = getTenantSlug(headers().get('host') ?? '') ?? '';
  return (
    <AuthShell title="Recuperar contraseña" description="Te enviaremos un enlace si el email pertenece a una cuenta registrada.">
      <ResetPasswordForm action={requestPasswordResetAction} tenantSlug={tenantSlug} />
    </AuthShell>
  );
}
