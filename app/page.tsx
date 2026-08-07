import { getCurrentTenant } from '@/lib/tenant';
import { getActiveProducts } from '@/lib/catalog';
import { CatalogGrid } from '@/components/tenant/catalog-grid';

export default async function HomePage() {
  const tenant = await getCurrentTenant();
  const { products } = await getActiveProducts();
  if (!tenant) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">StreamingOS</p>
        <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">Tu tienda digital, lista para crecer.</h1>
        <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">Visita el subdominio de tu vendedor para consultar su catálogo.</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Catálogo</p>
        <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Compra tu cuenta en {tenant.nombre_tienda}.</h1>
        <p className="mt-4 text-lg leading-8 text-slate-300">Selecciona un servicio disponible y recibe tus credenciales después de confirmar.</p>
      </div>
      <CatalogGrid products={products} />
    </main>
  );
}
