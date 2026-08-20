import { getSuperadminTenants } from '@/lib/superadmin-data';
import { updateTenantAction } from '@/lib/superadmin-actions';
import { TenantForm } from '@/components/superadmin/superadmin-forms';
import { requireSuperadmin } from '@/lib/auth/guards';

export default async function TenantsPage() { await requireSuperadmin(); const tenants = await getSuperadminTenants(); return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Tenants</p><h1 className="mt-2 text-3xl font-bold text-white">Gestión de tiendas</h1><div className="mt-8 grid gap-5">{tenants.map((tenant) => <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" key={tenant.id}><div className="mb-4 flex justify-between gap-4"><div><h2 className="font-semibold text-white">{tenant.nombre_tienda}</h2><p className="text-sm text-slate-400">{tenant.slug} · {tenant.custom_domain ?? 'Sin dominio'}</p></div><span className={tenant.activo ? 'text-emerald-300' : 'text-red-300'}>{tenant.activo ? 'Activo' : 'Suspendido'}</span></div><TenantForm action={updateTenantAction} tenant={tenant} /></article>)}</div></div>; }
