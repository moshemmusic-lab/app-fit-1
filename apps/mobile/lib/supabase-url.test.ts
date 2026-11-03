import { describe, expect, it } from 'vitest';

import { resolveSupabaseUrl } from './supabase-url';

describe('resolveSupabaseUrl', () => {
  it('points a local URL to the computer serving the app', () => {
    expect(resolveSupabaseUrl('http://127.0.0.1:54321', '192.168.0.27:8081')).toBe(
      'http://192.168.0.27:54321',
    );
    expect(resolveSupabaseUrl('http://localhost:54321/', '10.0.0.5:8082')).toBe(
      'http://10.0.0.5:54321/',
    );
  });

  it('leaves remote projects untouched', () => {
    const remote = 'https://abcdefgh.supabase.co';
    expect(resolveSupabaseUrl(remote, '192.168.0.27:8081')).toBe(remote);
  });

  it('leaves the URL untouched without a LAN dev server (tunnel, release build)', () => {
    expect(resolveSupabaseUrl('http://127.0.0.1:54321', 'abc-anonymous-8081.exp.direct')).toBe(
      'http://127.0.0.1:54321',
    );
    expect(resolveSupabaseUrl('http://127.0.0.1:54321', undefined)).toBe('http://127.0.0.1:54321');
  });

  it('does not touch hosts that merely start with "localhost"', () => {
    const url = 'http://localhost.example.com';
    expect(resolveSupabaseUrl(url, '192.168.0.27:8081')).toBe(url);
  });
});
