'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { OcrActionState } from '@/lib/ocr-actions';
import { InventoryForm } from '@/components/vendor/vendor-forms';
import type { AuthActionState } from '@/lib/auth/actions';

type OcrAction = (state: OcrActionState, formData: FormData) => Promise<OcrActionState>;
type InventoryAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

function SubmitImage() {
  const { pending } = useFormStatus();
  return <button className="rounded-full border border-violet-400/50 px-4 py-2 text-sm font-semibold text-violet-200 disabled:opacity-50" disabled={pending} type="submit">{pending ? 'Detectando...' : 'Detectar por imagen'}</button>;
}

export function OcrForm({ action, inventoryAction, productId }: { action: OcrAction; inventoryAction: InventoryAction; productId: string }) {
  const [state, formAction] = useFormState(action, {});
  const rawAccounts = state.credentials?.map((credential) => `${credential.correo}:${credential.password}`).join('\n') ?? '';
  return <div className="mt-4 grid gap-3 rounded-xl border border-dashed border-violet-400/40 p-4"><form action={formAction} className="grid gap-3"><input name="image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" required /><SubmitImage /></form>{state.error ? <p className="text-sm text-red-200">{state.error}</p> : null}{state.credentials ? <div className="grid gap-2"><p className="text-sm text-emerald-200">{state.credentials.length} cuentas detectadas · confianza {state.confidence?.toFixed(0)}%</p>{state.unrecognized?.length ? <p className="text-sm text-amber-200">Líneas no reconocidas: {state.unrecognized.join(' · ')}</p> : null}<p className="text-xs text-slate-400">Revisa y edita el resultado antes de confirmar.</p><InventoryForm action={inventoryAction} productId={productId} initialRawAccounts={rawAccounts} /></div> : null}</div>;
}
