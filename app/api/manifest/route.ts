import { getCurrentTenant } from '@/lib/tenant';

export async function GET() {
  const tenant = await getCurrentTenant();
  const name = tenant?.nombre_tienda ?? 'StreamingOS';
  const primaryColor = tenant?.color_primario ?? '#22d3ee';

  return Response.json({
    name,
    short_name: name,
    description: `Tienda digital de ${name}`,
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: primaryColor,
    icons: [
      { src: '/icons/icon-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any maskable' },
      { src: '/icons/icon-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' }
    ]
  });
}
