import { describe, expect, it } from 'vitest';

import { classifyError } from './errors';

describe('classifyError', () => {
  it('reports offline first when the phone has no connection', () => {
    expect(classifyError(new Error('anything'), false)).toBe('offline');
  });

  it('detects network failures from fetch, Auth and Functions', () => {
    expect(classifyError(new TypeError('Network request failed'), true)).toBe('offline');
    expect(classifyError({ name: 'AuthRetryableFetchError', status: 0 }, true)).toBe('offline');
    expect(classifyError({ name: 'FunctionsFetchError', message: 'x' }, true)).toBe('offline');
  });

  it('detects rate limits', () => {
    expect(classifyError({ name: 'AuthApiError', status: 429 }, true)).toBe('rateLimited');
    expect(classifyError({ code: 'over_email_send_rate_limit' }, true)).toBe('rateLimited');
  });

  it('detects wrong or expired sign-in codes', () => {
    expect(classifyError({ name: 'AuthApiError', status: 403, code: 'otp_expired' }, true)).toBe(
      'codeRejected',
    );
  });

  it('detects a taken username (unique violation)', () => {
    expect(classifyError({ code: '23505', message: 'duplicate key' }, true)).toBe('usernameTaken');
  });

  it('falls back to unknown', () => {
    expect(classifyError({ code: '42501' }, true)).toBe('unknown');
    expect(classifyError('boom', true)).toBe('unknown');
    expect(classifyError(null, true)).toBe('unknown');
  });
});
