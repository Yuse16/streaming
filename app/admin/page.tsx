import { requireAdminAccess } from '@/lib/auth/guards';
import { getVendorProducts, getPendingRecharges, getVendorSales } from '@/lib/vendor-data';
import { getSuperadminTenants } from '@/lib/superadmin-data';

export default async function AdminPage() {
  const context = await requireAdminAccess();
  if (!('tenant' in context)) {
    const tenants = await getSuperadminTenants();
    return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">StreamingOS</p><h1 className="mt-2 text-3xl font-bold text-white">Dashboard global</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Tenants activos</p><p className="mt-2 text-3xl font-bold text-white">{tenants.filter((tenant) => tenant.activo).length}</p></article><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Ventas totales</p><p className="mt-2 text-3xl font-bold text-emerald-200">{tenants.reduce((total, tenant) => total + tenant.ventas_total, 0)}</p></article><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Comisiones</p><p className="mt-2 text-3xl font-bold text-cyan-300">{tenants.reduce((total, tenant) => total + tenant.comisiones_total, 0).toFixed(2)}</p></article></div></div>;
  }
  const [products, recharges, sales] = await Promise.all([getVendorProducts(context.tenant.id), getPendingRecharges(context.tenant.id), getVendorSales(context.tenant.id)]);

  return (
    <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Dashboard</p><h1 className="mt-2 text-3xl font-bold text-white">Resumen de tu tienda</h1><div className="mt-8 grid gap-4 sm:grid-cols-3"><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Productos</p><p className="mt-2 text-3xl font-bold text-white">{products.length}</p></article><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Recargas pendientes</p><p className="mt-2 text-3xl font-bold text-amber-200">{recharges.length}</p></article><article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><p className="text-sm text-slate-400">Ventas recientes</p><p className="mt-2 text-3xl font-bold text-emerald-200">{sales.length}</p></article></div></div>
  );
}
