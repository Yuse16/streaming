import Link from 'next/link';

export function TenantBottomNav() {
  return <nav className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-2xl border border-slate-700/80 bg-slate-950/95 p-2 shadow-2xl backdrop-blur md:hidden"><Link className="rounded-xl px-2 py-2 text-center text-xs text-slate-300" href="/">Inicio</Link><Link className="rounded-xl px-2 py-2 text-center text-xs text-slate-300" href="/tienda">Tienda</Link><Link className="rounded-xl px-2 py-2 text-center text-xs text-slate-300" href="/recargar">Recargar</Link><Link className="rounded-xl px-2 py-2 text-center text-xs text-slate-300" href="/perfil">Perfil</Link></nav>;
}
