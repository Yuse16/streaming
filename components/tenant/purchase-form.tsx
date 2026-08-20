'use client';

import { useState } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import type { PurchaseActionState } from '@/lib/auth/actions';

type PurchaseAction = (state: PurchaseActionState, formData: FormData) => Promise<PurchaseActionState>;

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || pending}
      type="submit"
    >
      {pending ? 'Procesando compra...' : 'Confirmar compra'}
    </button>
  );
}

export function PurchaseForm({ action, productId, canAfford }: { action: PurchaseAction; productId: string; canAfford: boolean }) {
  const [state, formAction] = useFormState(action, {});
  const [copied, setCopied] = useState(false);
  const purchase = state.purchase;

  if (purchase) {
    const credentials = `${purchase.correo}:${purchase.password}`;
    return (
      <section className="grid gap-5 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">Compra exitosa</p>
          <h2 className="mt-2 text-2xl font-bold text-white">Tus credenciales están listas</h2>
        </div>
        <dl className="grid gap-3 rounded-xl bg-slate-950/60 p-4 text-sm">
          <div><dt className="text-slate-400">Correo</dt><dd className="mt-1 font-medium text-white">{purchase.correo}</dd></div>
          <div><dt className="text-slate-400">Contraseña</dt><dd className="mt-1 font-medium text-white">{purchase.password}</dd></div>
        </dl>
        <button
          className="rounded-full border border-emerald-300/50 px-5 py-3 font-semibold text-emerald-100"
          type="button"
          onClick={() => {
            void navigator.clipboard.writeText(credentials);
            setCopied(true);
          }}
        >
          {copied ? 'Copiado' : 'Copiar credenciales'}
        </button>
        <p className="text-sm text-emerald-100/80">También enviamos las credenciales a tu email cuando el correo transaccional está configurado.</p>
      </section>
    );
  }

  return (
    <form action={formAction} className="grid gap-4">
      <input name="productId" type="hidden" value={productId} />
      {state.error ? <p className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p> : null}
      {!canAfford ? <p className="text-sm text-amber-200">Tu saldo es insuficiente. Recarga antes de comprar.</p> : null}
      <SubmitButton disabled={!canAfford} />
    </form>
  );
}
