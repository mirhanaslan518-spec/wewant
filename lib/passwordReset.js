import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase';

export async function requestPasswordReset(email) {
  const redirectUri = AuthSession.makeRedirectUri({ path: 'reset-password' });

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUri,
  });

  if (error) {
    return { error: error.message };
  }
  return { success: true };
}
