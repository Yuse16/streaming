export function getSafeNextPath(value: string | null | undefined, fallback = '/tienda'): string {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  return value;
}
