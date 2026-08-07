import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { isValidWebhookSignature } from '@/lib/webhook';

describe('isValidWebhookSignature', () => {
  const body = JSON.stringify({ event_id: 'evt_1', amount: 100 });
  const secret = 'staging-secret';
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  it('accepts a valid signature with or without prefix', () => {
    expect(isValidWebhookSignature(body, signature, secret)).toBe(true);
    expect(isValidWebhookSignature(body, `sha256=${signature}`, secret)).toBe(true);
  });

  it('rejects altered payloads and malformed signatures', () => {
    expect(isValidWebhookSignature(`${body} `, signature, secret)).toBe(false);
    expect(isValidWebhookSignature(body, 'not-a-signature', secret)).toBe(false);
    expect(isValidWebhookSignature(body, null, secret)).toBe(false);
  });
});
