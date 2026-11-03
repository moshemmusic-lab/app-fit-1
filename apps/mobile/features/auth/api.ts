import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';

import { useOnboardingDraftStore } from '@/features/onboarding/onboarding-draft-store';
import { supabase } from '@/lib/supabase';

/** Sends a 6-digit code by email. Creates the account if it does not exist yet. */
export async function sendSignInCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  });
  if (error) throw error;
}

export async function verifySignInCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

/** Thrown when the user closes the Apple sheet: not an error worth showing. */
export class SignInCanceledError extends Error {}

function isAppleCancel(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_REQUEST_CANCELED'
  );
}

/**
 * Native Sign in with Apple. Apple receives a hashed nonce and Supabase the raw one,
 * so a stolen identity token cannot be replayed.
 */
export async function signInWithApple(): Promise<void> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });
  } catch (error) {
    if (isAppleCancel(error)) throw new SignInCanceledError();
    throw error;
  }

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token');
  }

  const name = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ');
  if (name) {
    useOnboardingDraftStore.getState().setSuggestedDisplayName(name);
  }

  const { error } = await supabase.auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
    nonce: rawNonce,
  });
  if (error) throw error;
}

/** Ends the session on this phone only. Needs a connection to revoke it on the server. */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

/** Deletes the account on the server (Edge Function) and then signs out on the phone. */
export async function deleteAccount(): Promise<void> {
  const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
  if (error) throw error;
  await signOut();
}
