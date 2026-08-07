import { notFound } from 'next/navigation';
import { AuthShell } from '@/components/auth/auth-shell';
import { PurchaseForm } from '@/components/tenant/purchase-form';
import { purchaseAccountAction } from '@/lib/auth/actions';
import { requireTenantMember } from '@/lib/auth/guards';
import { getProduct } from '@/lib/catalog';
import { getTenantBalance } from '@/lib/balance';

export default async function ProductPurchasePage({ params }: { params: { producto_id: string } }) {
  const { user, tenant } = await requireTenantMember();
  const product = await getProduct(params.producto_id);
  if (!product || product.estado !== 'activo') notFound();

  const balance = await getTenantBalance(tenant.id, user.id);
  return (
    <AuthShell title={`Comprar ${product.catalogo_servicios.nombre}`} description="Revisa el precio y confirma tu compra.">
      <div className="grid gap-6">
        <dl className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-5 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-slate-400">Producto</dt><dd className="font-medium text-white">{product.catalogo_servicios.nombre}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-400">Precio</dt><dd className="font-medium text-white">{product.precio.toFixed(2)} créditos</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-slate-400">Saldo actual</dt><dd className="font-medium text-white">{balance.toFixed(2)} créditos</dd></div>
          <div className="flex justify-between gap-4 border-t border-slate-800 pt-3"><dt className="text-slate-400">Saldo después</dt><dd className="font-semibold text-cyan-300">{(balance - product.precio).toFixed(2)} créditos</dd></div>
        </dl>
        <PurchaseForm action={purchaseAccountAction} productId={product.id} canAfford={balance >= product.precio} />
      </div>
    </AuthShell>
  );
}
