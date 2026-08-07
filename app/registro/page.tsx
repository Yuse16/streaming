import { headers } from 'next/headers';
import { AuthShell } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/auth-form';
import { signUpAction } from '@/lib/auth/actions';
import { getTenantSlug } from '@/lib/tenant-host';

export default function RegisterPage() {
  const tenantSlug = getTenantSlug(headers().get('host') ?? '') ?? '';
  return (
    <AuthShell title="Crear cuenta" description="Regístrate en la tienda del vendedor actual.">
      <SignUpForm action={signUpAction} tenantSlug={tenantSlug} />
    </AuthShell>
  );
}
