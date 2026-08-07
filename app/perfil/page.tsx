import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';
import { ProfileForm, PasswordChangeForm } from '@/components/client/client-forms';
import { changePasswordAction, updateProfileAction } from '@/lib/auth/actions';

export default async function ProfilePage() {
  const { user } = await requireTenantMember();
  const initialName = typeof user.user_metadata.display_name === 'string' ? user.user_metadata.display_name : '';
  return (
    <AuthShell title="Perfil" description="Administra tus datos y seguridad.">
      <div className="grid gap-6">
        <p className="text-sm text-slate-400">Email: <span className="text-slate-200">{user.email}</span></p>
        <ProfileForm action={updateProfileAction} initialName={initialName} />
        <PasswordChangeForm action={changePasswordAction} />
      </div>
    </AuthShell>
  );
}
