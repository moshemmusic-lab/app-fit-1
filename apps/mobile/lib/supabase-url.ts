const LOCAL_HOST = /^(https?:\/\/)(127\.0\.0\.1|localhost)(?=[:/]|$)/;
const IPV4 = /^\d{1,3}(\.\d{1,3}){3}$/;

/**
 * On a real phone, "127.0.0.1" is the phone itself. During development the local
 * Supabase runs on the computer that serves the app (Expo's `hostUri`, e.g.
 * "192.168.0.27:8081"), so point to that computer instead. Tunnels and remote
 * Supabase projects are left untouched.
 */
export function resolveSupabaseUrl(
  url: string,
  devServerHostUri: string | null | undefined,
): string {
  if (!devServerHostUri || !LOCAL_HOST.test(url)) return url;
  const devHost = devServerHostUri.split(':')[0] ?? '';
  if (!IPV4.test(devHost)) return url;
  return url.replace(LOCAL_HOST, `$1${devHost}`);
}
