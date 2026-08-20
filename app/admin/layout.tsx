import type { ReactNode } from 'react';
import { requireAdminAccess } from '@/lib/auth/guards';
import { VendorShell } from '@/components/vendor/vendor-shell';
import { SuperadminShell } from '@/components/superadmin/superadmin-shell';
import { headers } from 'next/headers';
import { isSuperadminHost } from '@/lib/tenant-host';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdminAccess();
  if (isSuperadminHost(headers().get('host') ?? '')) return <SuperadminShell>{children}</SuperadminShell>;
  return <VendorShell>{children}</VendorShell>;
}
