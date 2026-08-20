import { addInventoryAction, toggleProductAction } from '@/lib/auth/actions';
import { requireTenantAdmin } from '@/lib/auth/guards';
import { getVendorProducts } from '@/lib/vendor-data';
import { InventoryForm, ProductToggleForm } from '@/components/vendor/vendor-forms';
import { OcrForm } from '@/components/vendor/ocr-form';
import { extractAccountsAction } from '@/lib/ocr-actions';

export default async function InventoryAdminPage() {
  const { tenant } = await requireTenantAdmin();
  const products = await getVendorProducts(tenant.id);
  return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Inventario</p><h1 className="mt-2 text-3xl font-bold text-white">Productos y cuentas</h1><div className="mt-8 grid gap-5">{products.map((product) => <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5" key={product.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-violet-300">{product.catalogo_servicios.nombre}</p><h2 className="mt-1 text-xl font-semibold text-white">{product.precio.toFixed(2)} créditos</h2><p className="mt-2 text-sm text-slate-400">Stock disponible: {product.stock} · Estado: {product.estado}</p></div><ProductToggleForm action={toggleProductAction} productId={product.id} /></div><InventoryForm action={addInventoryAction} productId={product.id} /><OcrForm action={extractAccountsAction} inventoryAction={addInventoryAction} productId={product.id} /></article>)}</div></div>;
}
