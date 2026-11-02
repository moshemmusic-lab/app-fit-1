// Deletes the signed-in user's account: their files in Storage and their auth user.
// Rows in public tables go with the auth user through `on delete cascade`.
// This is the only place that uses the service role key (CLAUDE.md, data rule 3).
// When purchases exist (phase 2), they must be anonymized here instead of deleted.
import { createClient } from '@supabase/supabase-js';

const AVATARS_BUCKET = 'avatars';
// Users keep a single avatar (old ones are removed on upload), so one page is enough.
const MAX_AVATAR_FILES = 100;

function json(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Missing environment variable ${name}`);
  }
  return value;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') {
    return json(405, { error: 'method_not_allowed' });
  }

  const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    return json(401, { error: 'unauthorized' });
  }

  const admin = createClient(requireEnv('SUPABASE_URL'), requireEnv('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: userData, error: userError } = await admin.auth.getUser(token);
  if (userError || !userData.user) {
    return json(401, { error: 'unauthorized' });
  }
  const userId = userData.user.id;

  // Storage files are not removed by the cascade, so delete them first.
  const avatars = admin.storage.from(AVATARS_BUCKET);
  const { data: files, error: listError } = await avatars.list(userId, {
    limit: MAX_AVATAR_FILES,
  });
  if (listError) {
    console.error('delete-account: listing avatars failed', listError);
    return json(500, { error: 'delete_failed' });
  }
  if (files.length > 0) {
    const { error: removeError } = await avatars.remove(
      files.map((file) => `${userId}/${file.name}`),
    );
    if (removeError) {
      console.error('delete-account: removing avatars failed', removeError);
      return json(500, { error: 'delete_failed' });
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
  if (deleteError) {
    console.error('delete-account: deleting the user failed', deleteError);
    return json(500, { error: 'delete_failed' });
  }

  return json(200, { deleted: true });
});
