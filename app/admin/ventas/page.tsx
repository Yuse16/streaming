import { requireTenantAdmin } from '@/lib/auth/guards';
import { getVendorSales } from '@/lib/vendor-data';

export default async function SalesAdminPage() {
  const { tenant } = await requireTenantAdmin();
  const sales = await getVendorSales(tenant.id);
  return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Ventas</p><h1 className="mt-2 text-3xl font-bold text-white">Historial de ventas</h1><div className="mt-8 overflow-hidden rounded-2xl border border-slate-800"><table className="min-w-full text-left text-sm"><thead className="bg-slate-900 text-slate-400"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Cliente</th><th className="px-4 py-3">Servicio</th><th className="px-4 py-3">Precio</th></tr></thead><tbody className="divide-y divide-slate-800 bg-slate-950/50">{sales.map((sale) => <tr key={sale.id}><td className="px-4 py-3 text-slate-300">{new Date(sale.created_at).toLocaleDateString('es-MX')}</td><td className="px-4 py-3 font-mono text-xs text-slate-400">{sale.user_id}</td><td className="px-4 py-3 text-white">{Array.isArray(sale.productos) ? 'Cuenta digital' : sale.productos?.catalogo_servicios?.nombre ?? 'Cuenta digital'}</td><td className="px-4 py-3 text-cyan-300">{sale.precio.toFixed(2)}</td></tr>)}</tbody></table></div></div>;
}
