import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';
import { getCurrentTenantConfig } from '@/lib/tenant';
import { getRechargeHistory } from '@/lib/client-data';
import { RechargeForm } from '@/components/client/client-forms';
import { requestRechargeAction } from '@/lib/auth/actions';

export default async function RechargePage() {
  const { tenant, user } = await requireTenantMember();
  const [config, requests] = await Promise.all([
    getCurrentTenantConfig(tenant.id),
    getRechargeHistory(tenant.id, user.id)
  ]);
  return (
    <AuthShell title="Recargar créditos" description="Transfiere al vendedor y envía tu comprobante para solicitar la acreditación.">
      <div className="grid gap-6">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm text-slate-300">
          <h2 className="font-semibold text-white">Datos de transferencia</h2>
          <dl className="mt-4 grid gap-2"><div><dt className="text-slate-500">Banco</dt><dd>{config?.banco ?? 'Pendiente de configurar'}</dd></div><div><dt className="text-slate-500">CLABE</dt><dd>{config?.clabe ?? 'Pendiente de configurar'}</dd></div><div><dt className="text-slate-500">Titular</dt><dd>{config?.titular_cuenta ?? 'Pendiente de configurar'}</dd></div></dl>
          {config?.instrucciones_recarga ? <p className="mt-4 whitespace-pre-wrap border-t border-slate-800 pt-4">{config.instrucciones_recarga}</p> : null}
        </section>
        <RechargeForm action={requestRechargeAction} />
        <section className="grid gap-3"><h2 className="font-semibold text-white">Solicitudes anteriores</h2>{requests.length === 0 ? <p className="text-sm text-slate-400">No tienes solicitudes todavía.</p> : requests.map((request) => <article className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm" key={request.id}><div className="flex justify-between gap-4"><span className="text-slate-300">{request.monto.toFixed(2)} pesos · {request.creditos.toFixed(2)} créditos</span><span className="text-cyan-300">{request.estado}</span></div>{request.nota_rechazo ? <p className="mt-2 text-red-200">{request.nota_rechazo}</p> : null}</article>)}</section>
      </div>
    </AuthShell>
  );
}
