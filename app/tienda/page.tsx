import { AuthShell } from '@/components/auth/auth-shell';
import { requireTenantMember } from '@/lib/auth/guards';
import { getActiveProducts } from '@/lib/catalog';
import { CatalogGrid } from '@/components/tenant/catalog-grid';

export default async function ProtectedStorePage() {
  const { tenant } = await requireTenantMember();
  const { products } = await getActiveProducts();
  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Tienda privada</p>
        <h1 className="text-4xl font-bold tracking-tight text-white">Hola, disfruta {tenant.nombre_tienda}.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">Elige un producto para continuar con tu compra.</p>
      </div>
      <CatalogGrid products={products} />
    </main>
  );
}
