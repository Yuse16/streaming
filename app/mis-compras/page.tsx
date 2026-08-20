import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';
import { getPurchaseHistory } from '@/lib/client-data';

export default async function PurchasesPage() {
  const { tenant } = await requireTenantMember();
  const purchases = await getPurchaseHistory(tenant.id);
  return (
    <AuthShell title="Mis compras" description="Consulta las cuentas que has adquirido en esta tienda.">
      {purchases.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">Todavía no tienes compras.</p> : (
        <div className="grid gap-4">
          {purchases.map((purchase) => (
            <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" key={purchase.venta_id}>
              <div className="flex items-start justify-between gap-4"><div><p className="text-sm text-cyan-300">{purchase.servicio}</p><p className="mt-1 text-xs text-slate-500">{new Date(purchase.created_at).toLocaleString('es-MX')}</p></div><span className="text-sm font-semibold text-white">{purchase.precio.toFixed(2)} créditos</span></div>
              <dl className="mt-4 grid gap-2 text-sm"><div><dt className="text-slate-500">Correo</dt><dd className="text-slate-200">{purchase.correo}</dd></div><div><dt className="text-slate-500">Contraseña</dt><dd className="text-slate-200">{purchase.password}</dd></div></dl>
            </article>
          ))}
        </div>
      )}
    </AuthShell>
  );
}
