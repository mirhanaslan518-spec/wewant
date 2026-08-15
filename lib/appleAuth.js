import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from './supabase';

export async function signInWithApple() {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) {
      return { error: 'Apple girişi tamamlanamadı.' };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });

    if (error) {
      return { error: error.message };
    }

    return { success: true };
  } catch (e) {
    if (e.code === 'ERR_REQUEST_CANCELED') {
      return { error: null }; // kullanıcı iptal etti, hata gösterme
    }
    return { error: 'Apple girişi başarısız oldu.' };
  }
}
