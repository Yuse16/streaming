import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getTenantHostContext } from '@/lib/tenant-host';

const protectedPrefixes = ['/tienda', '/mis-compras', '/recargar', '/perfil', '/admin'];

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export async function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  const hostContext = getTenantHostContext(request.headers.get('host') ?? '');
  if (hostContext?.kind === 'superadmin') requestHeaders.set('x-context', 'superadmin');
  if (hostContext?.kind === 'slug') requestHeaders.set('x-tenant-slug', hostContext.slug);
  if (hostContext?.kind === 'domain') requestHeaders.set('x-tenant-domain', hostContext.domain);

  let response = NextResponse.next({ request: { headers: requestHeaders } });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Faltan variables de Supabase para el middleware');
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        requestHeaders.set('cookie', request.cookies.toString());
        response = NextResponse.next({ request: { headers: requestHeaders } });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }
    }
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (isProtectedPath(request.nextUrl.pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('next', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)']
};
