import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';

export default async function PurchasesPage() {
  await requireTenantMember();
  return (
    <AuthShell title="Mis compras" description="Tu historial estará disponible en la siguiente sesión.">
      <p className="text-sm text-slate-300">Ruta protegida correctamente.</p>
    </AuthShell>
  );
}
