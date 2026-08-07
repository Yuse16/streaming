const systemSubdomains = new Set(['www', 'admin', 'streamish']);

export function isSuperadminHost(hostname: string): boolean {
  const host = hostname.split(':')[0].toLowerCase();
  return host === 'admin.streamish.mx' || host === 'admin.localhost';
}

export function getTenantSlug(hostname: string): string | null {
  const host = hostname.split(':')[0].toLowerCase();
  const parts = host.split('.');

  if (host === 'localhost' || host === '127.0.0.1' || systemSubdomains.has(parts[0])) {
    return null;
  }

  if (host.endsWith('.localhost')) return parts[0] || null;
  if (host.endsWith('.streamish.mx') && parts.length === 3) return parts[0] || null;
  return null;
}
