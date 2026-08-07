import type { ReactNode } from 'react';
import { requireAdminAccess } from '@/lib/auth/guards';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();
  return <>{children}</>;
}
