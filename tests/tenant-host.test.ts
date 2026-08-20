import { describe, expect, it } from 'vitest';
import { getTenantHostContext, getTenantSlug, isSuperadminHost } from '@/lib/tenant-host';

describe('getTenantSlug', () => {
  it('resolves a localhost tenant with a port', () => {
    expect(getTenantSlug('test.localhost:3000')).toBe('test');
  });

  it('resolves a production tenant case-insensitively', () => {
    expect(getTenantSlug('PePe.streamish.mx')).toBe('pepe');
  });

  it('does not resolve system hosts', () => {
    expect(getTenantSlug('admin.streamish.mx')).toBeNull();
    expect(getTenantSlug('streamish.mx')).toBeNull();
  });

  it('does not resolve unrelated domains', () => {
    expect(getTenantSlug('tenant.example.com')).toBeNull();
  });

  it('does not resolve nested production subdomains', () => {
    expect(getTenantSlug('nested.test.streamish.mx')).toBeNull();
  });

  it('identifies the superadmin host', () => {
    expect(isSuperadminHost('superadmin.streamingos.mx:443')).toBe(true);
    expect(isSuperadminHost('admin.streamish.mx:443')).toBe(true);
    expect(isSuperadminHost('test.streamish.mx')).toBe(false);
  });

  it('resolves a custom tenant domain', () => {
    expect(getTenantHostContext('streamish.mx')).toEqual({ kind: 'domain', domain: 'streamish.mx' });
  });

  it('resolves the StreamingOS superadmin context', () => {
    expect(getTenantHostContext('superadmin.streamingos.mx')).toEqual({ kind: 'superadmin' });
  });
});
