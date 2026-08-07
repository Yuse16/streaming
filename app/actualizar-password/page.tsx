import { AuthShell } from '@/components/auth/auth-shell';
import { UpdatePasswordForm } from '@/components/auth/auth-form';
import { updatePasswordAction } from '@/lib/auth/actions';

export default function UpdatePasswordPage() {
  return (
    <AuthShell title="Nueva contraseña" description="Define una nueva contraseña para tu cuenta.">
      <UpdatePasswordForm action={updatePasswordAction} />
    </AuthShell>
  );
}
