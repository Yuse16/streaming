'use client';

import { useEffect, useState } from 'react';

export function OnlineStatus() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener('online', update);
    window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  return online ? null : <div className="fixed inset-x-0 top-0 z-50 bg-amber-300 px-4 py-2 text-center text-xs font-semibold text-amber-950">Sin conexión. Las operaciones se reactivarán al volver internet.</div>;
}
