import { adjustClientBalanceAction } from '@/lib/auth/actions';
import { requireTenantAdmin } from '@/lib/auth/guards';
import { getVendorClients } from '@/lib/vendor-data';
import { BalanceAdjustmentForm } from '@/components/vendor/vendor-forms';

export default async function ClientsAdminPage() {
  const { tenant } = await requireTenantAdmin();
  const clients = await getVendorClients(tenant.id);
  return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Clientes</p><h1 className="mt-2 text-3xl font-bold text-white">Clientes de tu tienda</h1><div className="mt-8 grid gap-4">{clients.length === 0 ? <p className="text-slate-400">Todavía no hay clientes.</p> : clients.map((client) => <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" key={client.id}><div className="flex justify-between gap-4"><div><p className="text-sm text-slate-400">Usuario</p><p className="font-mono text-sm text-white">{client.user_id}</p></div><p className="font-semibold text-cyan-300">{client.saldo.toFixed(2)} créditos</p></div><div className="mt-4"><BalanceAdjustmentForm action={adjustClientBalanceAction} userId={client.user_id} /></div></article>)}</div></div>;
}
