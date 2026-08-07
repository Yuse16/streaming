const systemHosts = new Set(['localhost', '127.0.0.1', 'streamingos.mx', 'www.streamingos.mx']);

export type TenantHostContext =
  | { kind: 'superadmin' }
  | { kind: 'slug'; slug: string }
  | { kind: 'domain'; domain: string }
  | null;

export function isSuperadminHost(hostname: string): boolean {
  const host = hostname.split(':')[0].toLowerCase();
  return host === 'superadmin.streamingos.mx'
    || host === 'superadmin.localhost'
    || host === 'admin.streamish.mx';
}

export function getTenantHostContext(hostname: string): TenantHostContext {
  const host = hostname.split(':')[0].toLowerCase();
  const parts = host.split('.');

  if (isSuperadminHost(host)) return { kind: 'superadmin' };
  if (systemHosts.has(host)) return null;

  if (host.endsWith('.localhost')) return parts[0] ? { kind: 'slug', slug: parts[0] } : null;
  if (host.endsWith('.streamish.mx') && parts.length === 3) {
    return parts[0] ? { kind: 'slug', slug: parts[0] } : null;
  }

  return { kind: 'domain', domain: host };
}

export function getTenantSlug(hostname: string): string | null {
  const context = getTenantHostContext(hostname);
  return context?.kind === 'slug' ? context.slug : null;
}
