import Link from 'next/link';
import type { CatalogProduct } from '@/lib/catalog';

export function ProductCard({ product }: { product: CatalogProduct }) {
  return (
    <article className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl shadow-slate-950/20">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-cyan-300">{product.catalogo_servicios.nombre}</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Cuenta digital</h2>
        </div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-800 text-xs font-semibold text-slate-300">
          {product.catalogo_servicios.nombre.slice(0, 2).toUpperCase()}
        </span>
      </div>
      <p className="mt-4 min-h-12 text-sm leading-6 text-slate-400">{product.descripcion ?? 'Entrega instantánea después de confirmar la compra.'}</p>
      <div className="mt-6 flex items-center justify-between gap-4">
        <p className="text-lg font-bold text-white">{product.precio.toFixed(2)} créditos</p>
        <Link className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950" href={`/comprar/${product.id}`}>
          Ver producto
        </Link>
      </div>
    </article>
  );
}
