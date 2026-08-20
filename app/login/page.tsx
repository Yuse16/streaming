import { AuthShell } from '@/components/auth/auth-shell';
import { LoginForm } from '@/components/auth/auth-form';
import { signInAction } from '@/lib/auth/actions';

export default function LoginPage({ searchParams }: { searchParams: { next?: string } }) {
  return (
    <AuthShell title="Iniciar sesión" description="Accede a tu tienda para consultar tu saldo y compras.">
      <LoginForm action={signInAction} next={searchParams.next} />
    </AuthShell>
  );
}
