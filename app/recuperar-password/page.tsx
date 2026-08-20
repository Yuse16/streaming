import { AuthShell } from '@/components/auth/auth-shell';
import { ResetPasswordForm } from '@/components/auth/auth-form';
import { requestPasswordResetAction } from '@/lib/auth/actions';

export default function RecoverPasswordPage() {
  return (
    <AuthShell title="Recuperar contraseña" description="Te enviaremos un enlace si el email pertenece a una cuenta registrada.">
      <ResetPasswordForm action={requestPasswordResetAction} />
    </AuthShell>
  );
}
