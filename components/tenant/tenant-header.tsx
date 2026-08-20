import Image from 'next/image';
import Link from 'next/link';
import type { Tenant } from '@/lib/tenant';

export function TenantHeader({ tenant, balance }: { tenant: Tenant; balance: number | null }) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
        <Link className="flex items-center gap-3" href="/">
          {tenant.logo_url ? (
            <Image className="rounded-lg object-cover" src={tenant.logo_url} alt="" width={36} height={36} />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-400 font-bold text-slate-950">S</span>
          )}
          <span className="font-semibold text-white">{tenant.nombre_tienda}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          {balance !== null ? <span className="rounded-full bg-slate-800 px-3 py-1 text-cyan-300">{balance.toFixed(2)} créditos</span> : null}
          <Link className="hover:text-cyan-300" href="/tienda">Tienda</Link>
          <Link className="hover:text-cyan-300" href="/login">Ingresar</Link>
        </nav>
      </div>
    </header>
  );
}
