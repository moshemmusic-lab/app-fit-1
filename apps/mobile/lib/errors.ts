export type ErrorKind = 'offline' | 'rateLimited' | 'codeRejected' | 'usernameTaken' | 'unknown';

const NETWORK_ERROR_NAMES = new Set(['AuthRetryableFetchError', 'FunctionsFetchError']);
const RATE_LIMIT_CODES = new Set(['over_email_send_rate_limit', 'over_request_rate_limit']);
const CODE_REJECTED_CODES = new Set(['otp_expired', 'otp_disabled']);
// Postgres unique_violation. The only unique column users edit is the username.
const UNIQUE_VIOLATION = '23505';

function readString(value: object, key: string): string | undefined {
  const field: unknown = (value as Record<string, unknown>)[key];
  return typeof field === 'string' ? field : undefined;
}

function readNumber(value: object, key: string): number | undefined {
  const field: unknown = (value as Record<string, unknown>)[key];
  return typeof field === 'number' ? field : undefined;
}

/**
 * Turns errors from Supabase (Auth, PostgREST, Storage, Functions) and fetch into
 * the few cases the screens explain differently.
 */
export function classifyError(error: unknown, isOnline: boolean): ErrorKind {
  if (!isOnline) return 'offline';
  if (typeof error !== 'object' || error === null) return 'unknown';

  const name = readString(error, 'name') ?? '';
  const message = readString(error, 'message') ?? '';
  const code = readString(error, 'code') ?? '';
  const status = readNumber(error, 'status');

  if (NETWORK_ERROR_NAMES.has(name) || message.includes('Network request failed')) {
    return 'offline';
  }
  if (status === 429 || RATE_LIMIT_CODES.has(code)) return 'rateLimited';
  if (CODE_REJECTED_CODES.has(code)) return 'codeRejected';
  if (code === UNIQUE_VIOLATION) return 'usernameTaken';
  return 'unknown';
}
