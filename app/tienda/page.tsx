import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';

export default async function ProtectedStorePage() {
  const { tenant } = await requireTenantMember();
  return (
    <AuthShell title="Tienda protegida" description={`Sesión autenticada en ${tenant.nombre_tienda}.`}>
      <p className="text-sm text-slate-300">El catálogo estará disponible en la siguiente sesión.</p>
    </AuthShell>
  );
}
