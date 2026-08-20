'use client';

import { useEffect, useState } from 'react';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !installEvent) return null;
  return (
    <aside className="fixed inset-x-4 bottom-20 z-50 flex items-center justify-between gap-4 rounded-2xl border border-cyan-300/30 bg-slate-900 p-4 shadow-2xl md:bottom-4 md:left-auto md:max-w-sm">
      <p className="text-sm text-slate-200">Instala esta tienda como app para acceder más rápido.</p>
      <div className="flex shrink-0 gap-2">
        <button className="text-xs text-slate-400" onClick={() => setVisible(false)} type="button">Ahora no</button>
        <button className="rounded-full bg-cyan-400 px-3 py-2 text-xs font-semibold text-slate-950" onClick={() => { void installEvent.prompt(); setVisible(false); }} type="button">Instalar</button>
      </div>
    </aside>
  );
}
