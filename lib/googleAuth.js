import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { supabase } from './supabase';

WebBrowser.maybeCompleteAuthSession();

function parseUrlParams(url) {
  const params = {};
  const hashIndex = url.indexOf('#');
  const queryIndex = url.indexOf('?');
  const idx = hashIndex !== -1 ? hashIndex : queryIndex;
  if (idx === -1) return params;
  const paramString = url.slice(idx + 1);
  paramString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) params[key] = decodeURIComponent(value || '');
  });
  return params;
}

export async function signInWithGoogle() {
  const redirectUri = AuthSession.makeRedirectUri({ scheme: 'wewant' });

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

  const params = parseUrlParams(result.url);

  if (!params.access_token || !params.refresh_token) {
    return { error: 'Giriş tamamlanamadı.' };
  }

  const { error: sessionError } = await supabase.auth.setSession({
    access_token: params.access_token,
    refresh_token: params.refresh_token,
  });

  if (sessionError) {
    return { error: sessionError.message };
  }

  return { success: true };
}
