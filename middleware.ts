import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const systemSubdomains = new Set(['www', 'admin', 'streamish']);

function getTenantSlug(hostname: string): string | null {
  const host = hostname.split(':')[0];
  const parts = host.split('.');

  if (host === 'localhost' || host === '127.0.0.1' || systemSubdomains.has(parts[0])) {
    return null;
  }

  if (host.endsWith('.localhost')) return parts[0] || null;
  if (host.endsWith('.streamish.mx') && parts.length >= 3) return parts[0] || null;
  return null;
}

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const slug = getTenantSlug(request.headers.get('host') ?? '');

  if (slug) response.headers.set('x-tenant-slug', slug);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
