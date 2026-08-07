import { AuthShell } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/auth-form';
import { signUpAction } from '@/lib/auth/actions';

export default function RegisterPage() {
  return (
    <AuthShell title="Crear cuenta" description="Regístrate en la tienda del vendedor actual.">
      <SignUpForm action={signUpAction} />
    </AuthShell>
  );
}
