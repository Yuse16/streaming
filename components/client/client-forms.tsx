'use client';

import { useFormState, useFormStatus } from 'react-dom';
import type { AuthActionState } from '@/lib/auth/actions';

type ClientAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return <button className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50" disabled={pending} type="submit">{pending ? 'Guardando...' : label}</button>;
}

function Message({ state }: { state: AuthActionState }) {
  if (state.error) return <p className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p>;
  if (state.success) return <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-200">{state.success}</p>;
  return null;
}

export function ProfileForm({ action, initialName }: { action: ClientAction; initialName: string }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <label className="grid gap-2 text-sm text-slate-300">
        <span>Nombre</span>
        <input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" name="displayName" defaultValue={initialName} required />
      </label>
      <Message state={state} />
      <div><SubmitButton label="Guardar perfil" /></div>
    </form>
  );
}

export function PasswordChangeForm({ action }: { action: ClientAction }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5">
      <label className="grid gap-2 text-sm text-slate-300"><span>Nueva contraseña</span><input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" name="password" type="password" autoComplete="new-password" required /></label>
      <label className="grid gap-2 text-sm text-slate-300"><span>Confirmar contraseña</span><input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" name="confirmation" type="password" autoComplete="new-password" required /></label>
      <Message state={state} />
      <div><SubmitButton label="Cambiar contraseña" /></div>
    </form>
  );
}

export function RechargeForm({ action }: { action: ClientAction }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-5" encType="multipart/form-data">
      <label className="grid gap-2 text-sm text-slate-300"><span>Monto transferido</span><input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" name="amount" type="number" min="1" step="0.01" required /></label>
      <label className="grid gap-2 text-sm text-slate-300"><span>Banco de origen</span><input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" name="bank" required /></label>
      <label className="grid gap-2 text-sm text-slate-300"><span>Referencia o folio</span><input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white" name="reference" /></label>
      <label className="grid gap-2 text-sm text-slate-300"><span>Comprobante</span><input className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-slate-300 file:mr-4 file:rounded-full file:border-0 file:bg-cyan-400 file:px-4 file:py-2 file:font-semibold file:text-slate-950" name="receipt" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" required /></label>
      <Message state={state} />
      <div><SubmitButton label="Enviar solicitud" /></div>
    </form>
  );
}
