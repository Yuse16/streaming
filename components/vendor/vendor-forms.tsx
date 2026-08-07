'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { AuthActionState } from '@/lib/auth/actions';

type VendorAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="rounded-full bg-violet-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={pending} type="submit">{pending ? 'Procesando...' : label}</button>;
}

function Message({ state }: { state: AuthActionState }) {
  if (state.error) return <p className="text-sm text-red-200">{state.error}</p>;
  if (state.success) return <p className="text-sm text-emerald-200">{state.success}</p>;
  return null;
}

export function InventoryForm({ action, productId, initialRawAccounts = '' }: { action: VendorAction; productId: string; initialRawAccounts?: string }) {
  const [state, formAction] = useFormState(action, {});
  return <form action={formAction} className="mt-4 grid gap-3"><input name="productId" type="hidden" value={productId} /><textarea className="min-h-28 rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" name="rawAccounts" placeholder="correo@dominio.com:contraseña" defaultValue={initialRawAccounts} required /><Message state={state} /><div><Submit label="Agregar cuentas" /></div></form>;
}

export function ProductToggleForm({ action, productId }: { action: VendorAction; productId: string }) {
  const [state, formAction] = useFormState(action, {});
  return <form action={formAction} className="grid gap-2"><input name="productId" type="hidden" value={productId} /><Submit label="Cambiar estado" /><Message state={state} /></form>;
}

export function RechargeDecisionForm({ action, rechargeId, reject = false }: { action: VendorAction; rechargeId: string; reject?: boolean }) {
  const [state, formAction] = useFormState(action, {});
  return <form action={formAction} className="grid gap-2">{reject ? <textarea className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white" name="note" placeholder="Motivo del rechazo" required /> : null}<input name={reject ? 'rechargeId' : 'rechargeId'} type="hidden" value={rechargeId} /><Submit label={reject ? 'Rechazar' : 'Aprobar'} /><Message state={state} /></form>;
}

export function BalanceAdjustmentForm({ action, userId }: { action: VendorAction; userId: string }) {
  const [state, formAction] = useFormState(action, {});
  return <form action={formAction} className="grid gap-2 sm:grid-cols-[120px_1fr_auto]"><input name="userId" type="hidden" value={userId} /><input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white" name="credits" type="number" step="0.01" placeholder="Créditos" required /><input className="rounded-lg border border-slate-700 bg-slate-950 p-2 text-sm text-white" name="note" placeholder="Nota del ajuste" required /><Submit label="Ajustar" /><Message state={state} /></form>;
}

export function StoreConfigForm({ action, initial }: { action: VendorAction; initial: { storeName: string; primaryColor: string; logoUrl: string; bank: string; clabe: string; accountHolder: string; rechargeInstructions: string } }) {
  const [state, formAction] = useFormState(action, {});
  return <form action={formAction} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5"><label className="grid gap-2 text-sm text-slate-300">Nombre<input className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" name="storeName" defaultValue={initial.storeName} required /></label><label className="grid gap-2 text-sm text-slate-300">Color primario<input className="h-11 rounded-lg border border-slate-700 bg-slate-950 p-1" name="primaryColor" type="color" defaultValue={initial.primaryColor} required /></label><label className="grid gap-2 text-sm text-slate-300">Logo URL<input className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" name="logoUrl" defaultValue={initial.logoUrl} /></label><label className="grid gap-2 text-sm text-slate-300">Banco<input className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" name="bank" defaultValue={initial.bank} /></label><label className="grid gap-2 text-sm text-slate-300">CLABE<input className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" name="clabe" defaultValue={initial.clabe} /></label><label className="grid gap-2 text-sm text-slate-300">Titular<input className="rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" name="accountHolder" defaultValue={initial.accountHolder} /></label><label className="grid gap-2 text-sm text-slate-300">Instrucciones<textarea className="min-h-28 rounded-lg border border-slate-700 bg-slate-950 p-3 text-white" name="rechargeInstructions" defaultValue={initial.rechargeInstructions} /></label><Message state={state} /><div><Submit label="Guardar configuración" /></div></form>;
}
