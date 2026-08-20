import { getCommissionSummaries } from '@/lib/superadmin-data';
import { markCommissionsCollectedAction } from '@/lib/superadmin-actions';
import { CommissionForm } from '@/components/superadmin/superadmin-forms';
import { requireSuperadmin } from '@/lib/auth/guards';

export default async function CommissionsPage() { await requireSuperadmin(); const summaries = await getCommissionSummaries(); return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Comisiones</p><h1 className="mt-2 text-3xl font-bold text-white">Resumen por tenant</h1><div className="mt-8 grid gap-4">{summaries.map((summary) => <article className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5" key={summary.tenant_id}><div><h2 className="font-semibold text-white">{summary.tenant_name}</h2><p className="mt-1 text-sm text-slate-400">Total: {summary.total.toFixed(2)} · Pendiente: {summary.pending.toFixed(2)}</p></div><CommissionForm action={markCommissionsCollectedAction} tenantId={summary.tenant_id} /></article>)}</div></div>; }
