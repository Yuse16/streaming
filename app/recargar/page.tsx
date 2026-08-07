import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';

export default async function RechargePage() {
  await requireTenantMember();
  return (
    <AuthShell title="Recargar" description="Las recargas estarán disponibles en la siguiente sesión.">
      <p className="text-sm text-slate-300">Ruta protegida correctamente.</p>
    </AuthShell>
  );
}
