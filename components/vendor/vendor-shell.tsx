import Link from 'next/link';
import type { ReactNode } from 'react';

const links = [
  ['Dashboard', '/admin'],
  ['Inventario', '/admin/inventario'],
  ['Clientes', '/admin/clientes'],
  ['Recargas', '/admin/recargas'],
  ['Ventas', '/admin/ventas'],
  ['Configuración', '/admin/config']
] as const;

export function VendorShell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto min-h-screen max-w-6xl px-6 py-8">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
          <p className="mb-5 px-3 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300">StreamingOS</p>
          <nav className="grid gap-1">{links.map(([label, href]) => <Link className="rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white" href={href} key={href}>{label}</Link>)}</nav>
        </aside>
        <section>{children}</section>
      </div>
    </div>
  );
}
