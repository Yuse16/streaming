import { describe, expect, it } from 'vitest';
import { parseCredentials } from '@/lib/ocr';

describe('parseCredentials', () => {
  it('parses valid email and password lines', () => {
    const result = parseCredentials('uno@example.com:clave123\ndos@example.com|clave456');
    expect(result.credentials).toEqual([
      { correo: 'uno@example.com', password: 'clave123' },
      { correo: 'dos@example.com', password: 'clave456' }
    ]);
    expect(result.unrecognized).toHaveLength(0);
  });

  it('returns invalid lines for manual review', () => {
    const result = parseCredentials('texto ilegible\nuser@example.com:abc');
    expect(result.credentials).toHaveLength(0);
    expect(result.unrecognized).toEqual(['texto ilegible', 'user@example.com:abc']);
  });
});
