import { AuthShell } from '@/components/auth/auth-shell';
import { requireAdminAccess } from '@/lib/auth/guards';

export default async function AdminPage() {
  const context = await requireAdminAccess();
  const name = 'tenant' in context ? context.tenant.nombre_tienda : 'Streamish';

  return (
    <AuthShell title="Panel protegido" description={`Acceso autorizado para ${name}.`}>
      <p className="text-sm text-slate-300">Las herramientas del panel se implementarán en su sesión correspondiente.</p>
    </AuthShell>
  );
}
