import { getCurrentTenant } from '@/lib/tenant';

export default async function HomePage() {
  const tenant = await getCurrentTenant();
  const storeName = tenant?.nombre_tienda ?? 'Streamish';

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Streamish</p>
      <h1 className="max-w-3xl text-4xl font-bold tracking-tight text-white sm:text-6xl">
        {storeName}
      </h1>
      <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
        La tienda multi-tenant está lista para configurarse.
      </p>
      <div className="mt-10 flex gap-4">
        <a className="rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950" href="/login">
          Iniciar sesión
        </a>
        <a className="rounded-full border border-slate-600 px-5 py-3 font-semibold text-slate-200" href="/registro">
          Crear cuenta
        </a>
      </div>
    </main>
  );
}
