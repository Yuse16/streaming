import { headers } from 'next/headers';
import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/auth-form';
import { signInAction } from '@/lib/auth/actions';
import { getTenantSlug } from '@/lib/tenant-host';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  const tenantSlug = getTenantSlug(headers().get('host') ?? '') ?? '';
  return (
    <AuthShell title="Iniciar sesión" description="Accede a tu tienda para consultar tu saldo y compras.">
      <LoginForm action={signInAction} tenantSlug={tenantSlug} next={searchParams.next} />
    </AuthShell>
  );
}
