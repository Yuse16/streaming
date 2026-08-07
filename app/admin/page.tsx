import { requireAdminAccess } from '@/lib/auth/guards';
import { getVendorProducts, getPendingRecharges, getVendorSales } from '@/lib/vendor-data';

export default async function AdminPage() {
  const context = await requireAdminAccess();
  if (!('tenant' in context)) return <p className="text-slate-300">El dashboard superadmin se implementará en su sesión.</p>;
  const [products, recharges, sales] = await Promise.all([getVendorProducts(context.tenant.id), getPendingRecharges(context.tenant.id), getVendorSales(context.tenant.id)]);

  return (
    <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Dashboard</p><h1 className="mt-2 text-3xl font-bold text-white">Resumen de tu tienda</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Productos</p><p className="mt-2 text-3xl font-bold text-white">{products.length}</p></article><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Recargas pendientes</p><p className="mt-2 text-3xl font-bold text-amber-200">{recharges.length}</p></article><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Ventas recientes</p><p className="mt-2 text-3xl font-bold text-emerald-200">{sales.length}</p></article></div></div>
  );
}
