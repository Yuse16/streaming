import { AuthShell } from '@/components/auth/auth-shell';
import { PasswordRecovery } from '@/components/auth/password-recovery';
import { updatePasswordAction } from '@/lib/auth/actions';

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Nueva contraseña" description="Define una nueva contraseña para tu cuenta.">
      <PasswordRecovery action={updatePasswordAction} />
    </AuthShell>
  );
}
