import { headers } from 'next/headers';
import { AuthShell } from '@/components/auth/auth-shell';

export default function ProtectedStorePage() {
  const tenantSlug = headers().get('x-tenant-slug');
  return (
    <AuthShell title="Tienda protegida" description={`Sesión autenticada en ${tenantSlug ?? 'tu tienda'}.`}>
      <p className="text-sm text-slate-300">El catálogo estará disponible en la siguiente sesión.</p>
    </AuthShell>
  );
}
