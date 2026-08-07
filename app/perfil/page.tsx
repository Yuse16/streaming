import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';

export default async function ProfilePage() {
  await requireTenantMember();
  return (
    <AuthShell title="Perfil" description="Tu perfil estará disponible en la siguiente sesión.">
      <p className="text-sm text-slate-300">Ruta protegida correctamente.</p>
    </AuthShell>
  );
}
