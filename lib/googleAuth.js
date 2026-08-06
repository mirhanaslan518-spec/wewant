import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

function extractCode(url) {
  const match = url.match(/[?&#]code=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUri,
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    return { error: error?.message || 'Google girişi başlatılamadı.' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUri);

  if (result.type !== 'success' || !result.url) {
    return { error: null }; // kullanıcı iptal etti, hata gösterme
  }

  const code = extractCode(result.url);
  if (!code) {
    return { error: 'Giriş tamamlanamadı, tekrar dene.' };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return { error: exchangeError.message };
  }

  return { success: true };
}
