'use client';

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16 text-center"><p className="text-sm font-semibold uppercase tracking-[0.2em] text-red-300">Error temporal</p><h1 className="mt-3 text-3xl font-bold text-white">No pudimos cargar esta página</h1><p className="mt-4 text-slate-400">Intenta nuevamente. Si el problema continúa, contacta al administrador.</p><button className="mt-8 rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950" onClick={reset} type="button">Reintentar</button></main>;
}
