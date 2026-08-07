import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import './globals.css';
import { TenantHeader } from '@/components/tenant/tenant-header';
import { getCurrentTenant } from '@/lib/tenant';
import { getTenantBalance } from '@/lib/balance';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Streamish',
  description: 'Tu tienda de cuentas digitales'
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const tenant = await getCurrentTenant();
  const style = { '--color-primary': tenant?.color_primario ?? '#22d3ee' } as CSSProperties;
  const supabase = tenant ? createClient() : null;
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const balance = tenant && user ? await getTenantBalance(tenant.id, user.id) : null;

  return (
    <html lang="es">
      <body style={style}>
        {tenant ? <TenantHeader tenant={tenant} balance={balance} /> : null}
        {children}
      </body>
    </html>
  );
}
