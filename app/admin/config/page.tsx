import { updateStoreConfigAction } from '@/lib/auth/actions';
import { requireTenantAdmin } from '@/lib/auth/guards';
import { getCurrentTenantConfig } from '@/lib/tenant';
import { StoreConfigForm } from '@/components/vendor/vendor-forms';

export default async function StoreConfigPage() {
  const { tenant } = await requireTenantAdmin();
  const config = await getCurrentTenantConfig(tenant.id);
  return <div><p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">Configuración</p><h1 className="mt-2 text-3xl font-bold text-white">Personaliza tu tienda</h1><div className="mt-8"><StoreConfigForm action={updateStoreConfigAction} initial={{ storeName: tenant.nombre_tienda, primaryColor: tenant.color_primario, logoUrl: tenant.logo_url ?? '', bank: config?.banco ?? '', clabe: config?.clabe ?? '', accountHolder: config?.titular_cuenta ?? '', rechargeInstructions: config?.instrucciones_recarga ?? '' }} /></div></div>;
}
