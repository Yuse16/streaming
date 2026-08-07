import { approveRechargeAction, rejectRechargeAction } from '@/lib/auth/actions';
import { requireTenantAdmin } from '@/lib/auth/guards';
import { getPendingRecharges } from '@/lib/vendor-data';
import { RechargeDecisionForm } from '@/components/vendor/vendor-forms';
import { createClient } from '@/lib/supabase/server';

export default async function RechargeAdminPage() {
  const { tenant } = await requireTenantAdmin();
  const requests = await getPendingRecharges(tenant.id);
  const supabase = createClient();
  const requestsWithLinks = await Promise.all(requests.map(async (request) => {
    if (!request.comprobante_url) return { request, url: null };
    const { data } = await supabase.storage.from('comprobantes').createSignedUrl(request.comprobante_url, 600);
    return { request, url: data?.signedUrl ?? null };
  }));
  return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Recargas</p><h1 className="mt-2 text-3xl font-bold text-white">Solicitudes pendientes</h1><div className="mt-8 grid gap-4">{requestsWithLinks.length === 0 ? <p className="text-slate-400">No hay solicitudes pendientes.</p> : requestsWithLinks.map(({ request, url }) => <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" key={request.id}><p className="text-sm text-slate-400">Cliente: {request.user_id}</p><p className="mt-2 text-lg font-semibold text-white">{request.monto.toFixed(2)} pesos · {request.creditos.toFixed(2)} créditos</p><p className="mt-2 text-sm text-slate-400">{request.banco_origen ?? 'Banco no indicado'} · {request.referencia ?? 'Sin referencia'}</p>{url ? <a className="mt-3 inline-block text-sm text-cyan-300 underline" href={url} target="_blank" rel="noreferrer">Ver comprobante</a> : null}<div className="mt-5 grid gap-4 sm:grid-cols-2"><RechargeDecisionForm action={approveRechargeAction} rechargeId={request.id} /><RechargeDecisionForm action={rejectRechargeAction} rechargeId={request.id} reject /></div></article>)}</div></div>;
}
