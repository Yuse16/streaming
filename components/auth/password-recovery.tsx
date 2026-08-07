'use client';

import { useEffect, useState } from 'react';
import type { AuthActionState } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/client';
import { UpdatePasswordForm } from '@/components/auth/auth-form';

type AuthAction = (state: AuthActionState, formData: FormData) => Promise<AuthActionState>;

export function PasswordRecovery({ action }: { action: AuthAction }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;

    async function establishSession() {
      const supabase = createClient();
      const code = new URLSearchParams(window.location.search).get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          if (active) setStatus('error');
          return;
        }
        window.history.replaceState({}, document.title, '/actualizar-password');
      }

      const { data } = await supabase.auth.getUser();
      if (active) setStatus(data.user ? 'ready' : 'error');
    }

    void establishSession();
    return () => {
      active = false;
    };
  }, []);

  if (status === 'loading') return <p className="text-sm text-slate-300">Validando enlace...</p>;
  if (status === 'error') return <p className="rounded-lg border border-red-400/40 bg-red-400/10 p-3 text-sm text-red-200">El enlace no es válido o ya expiró.</p>;
  return <UpdatePasswordForm action={action} />;
}
