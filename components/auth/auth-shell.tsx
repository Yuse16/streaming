import type { ReactNode } from 'react';

export function AuthShell({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <p className="mb-3 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Streamish</p>
      <h1 className="text-3xl font-bold tracking-tight text-white">{title}</h1>
      <p className="mt-3 text-sm leading-6 text-slate-400">{description}</p>
      <div className="mt-8">{children}</div>
    </main>
  );
}
