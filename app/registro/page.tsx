import { AuthShell } from '@/components/auth/auth-shell';
import { SignUpForm } from '@/components/auth/auth-form';
import { OnboardingForm } from '@/components/auth/auth-form';
import { requestOnboardingAction, signUpAction } from '@/lib/auth/actions';
import { getCurrentTenant } from '@/lib/tenant';

export default async function RegisterPage() {
  const tenant = await getCurrentTenant();
  if (!tenant) return <AuthShell title="Vende con StreamingOS" description="Solicita tu propia tienda white-label."><OnboardingForm action={requestOnboardingAction} /></AuthShell>;
  return (
    <AuthShell title="Crear cuenta" description="Regístrate en la tienda del vendedor actual.">
      <SignUpForm action={signUpAction} />
    </AuthShell>
  );
}
