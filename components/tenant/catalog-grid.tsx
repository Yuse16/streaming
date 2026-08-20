import type { CatalogProduct } from '@/lib/catalog';
import { ProductCard } from '@/components/tenant/product-card';

export function CatalogGrid({ products }: { products: CatalogProduct[] }) {
  if (products.length === 0) {
    return <p className="rounded-2xl border border-dashed border-slate-700 p-8 text-center text-slate-400">No hay productos disponibles por ahora.</p>;
  }

  return <div className="grid gap-5 sm:grid-cols-2">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>;
}
