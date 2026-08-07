'use client';

import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import type { AuthActionState } from '@/lib/auth/actions';

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      className="w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={pending}
      type="submit"
    >
      {pending ? 'Procesando...' : label}
    </button>
  );
}

function FormMessage({ state }: { state: AuthActionState }) {
  if (state.error) return <p className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">{state.error}</p>;
  if (state.success) return <p className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-200">{state.success}</p>;
  return null;
}

function Field({ label, name, type = 'text', autoComplete }: { label: string; name: string; type?: string; autoComplete?: string }) {
  return (
    <label className="grid gap-2 text-sm text-slate-300">
      <span>{label}</span>
      <input
        className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none ring-cyan-300 focus:ring-2"
        name={name}
        required
        type={type}
        autoComplete={autoComplete}
      />
    </label>
  );
}

export function LoginForm({ action, next }: { action: AuthAction; next?: string }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="grid gap-5">
      <input name="next" type="hidden" value={next ?? ''} />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Contraseña" name="password" type="password" autoComplete="current-password" />
      <FormMessage state={state} />
      <SubmitButton label="Iniciar sesión" />
      <div className="flex justify-between text-sm text-slate-400">
        <Link className="hover:text-cyan-300" href="/recuperar-password">Recuperar contraseña</Link>
        <Link className="hover:text-cyan-300" href="/registro">Crear cuenta</Link>
      </div>
    </form>
  );
}

export function SignUpForm({ action }: { action: AuthAction }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="grid gap-5">
      <Field label="Nombre" name="name" autoComplete="name" />
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <Field label="Contraseña" name="password" type="password" autoComplete="new-password" />
      <FormMessage state={state} />
      <SubmitButton label="Crear cuenta" />
      <Link className="text-center text-sm text-slate-400 hover:text-cyan-300" href="/login">Ya tengo una cuenta</Link>
    </form>
  );
}

export function ResetPasswordForm({ action }: { action: AuthAction }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="grid gap-5">
      <Field label="Email" name="email" type="email" autoComplete="email" />
      <FormMessage state={state} />
      <SubmitButton label="Enviar instrucciones" />
      <Link className="text-center text-sm text-slate-400 hover:text-cyan-300" href="/login">Volver al login</Link>
    </form>
  );
}

export function UpdatePasswordForm({ action }: { action: AuthAction }) {
  const [state, formAction] = useFormState(action, {});
  return (
    <form action={formAction} className="grid gap-5">
      <Field label="Nueva contraseña" name="password" type="password" autoComplete="new-password" />
      <Field label="Confirmar contraseña" name="confirmation" type="password" autoComplete="new-password" />
      <FormMessage state={state} />
      <SubmitButton label="Actualizar contraseña" />
      <Link className="text-center text-sm text-slate-400 hover:text-cyan-300" href="/login">Volver al login</Link>
    </form>
  );
}

export function OnboardingForm({ action }: { action: AuthAction }) {
  const [state, formAction] = useFormState(action, {});
  return <form action={formAction} className="grid gap-4"><Field label="Nombre comercial" name="commercialName" /><Field label="Slug deseado" name="desiredSlug" /><Field label="Email" name="email" type="email" autoComplete="email" /><Field label="WhatsApp" name="whatsapp" type="tel" /><label className="grid gap-2 text-sm text-slate-300"><span>Servicios que vendes</span><textarea className="min-h-24 rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100" name="services" /></label><FormMessage state={state} /><SubmitButton label="Solicitar acceso" /></form>;
}
