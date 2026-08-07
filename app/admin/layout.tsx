import type { ReactNode } from 'react';
import { requireAdminAccess } from '@/lib/auth/guards';
import { VendorShell } from '@/components/vendor/vendor-shell';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();
  return <VendorShell>{children}</VendorShell>;
}
