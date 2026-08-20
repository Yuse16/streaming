import { describe, expect, it } from 'vitest';
import { getSafeNextPath } from '@/lib/auth/redirect';

describe('getSafeNextPath', () => {
  it('accepts an internal path', () => {
    expect(getSafeNextPath('/mis-compras')).toBe('/mis-compras');
  });

  it('rejects external redirects', () => {
    expect(getSafeNextPath('https://example.com')).toBe('/tienda');
    expect(getSafeNextPath('//example.com')).toBe('/tienda');
  });
});
