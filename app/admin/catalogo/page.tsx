import { getCatalogServices } from '@/lib/superadmin-data';
import { upsertCatalogAction } from '@/lib/superadmin-actions';
import { CatalogForm } from '@/components/superadmin/superadmin-forms';
import { requireSuperadmin } from '@/lib/auth/guards';

export default async function CatalogPage() { await requireSuperadmin(); const services = await getCatalogServices(); return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Catálogo global</p><h1 className="mt-2 text-3xl font-bold text-white">Servicios disponibles</h1><div className="mt-8 grid gap-6"><CatalogForm action={upsertCatalogAction} /><div className="grid gap-3">{services.map((service) => <article className="flex justify-between rounded-xl border border-slate-800 bg-slate-900/70 p-4" key={service.id}><span className="text-white">{service.nombre} <small className="text-slate-500">({service.slug})</small></span><span className={service.activo ? 'text-emerald-300' : 'text-slate-500'}>{service.activo ? 'Activo' : 'Inactivo'}</span></article>)}</div></div></div>; }
