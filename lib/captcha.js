import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';

const CAPTCHA_PAGE_URL = 'https://mirhanaslan518-spec.github.io/wewant/captcha.html';

WebBrowser.maybeCompleteAuthSession();

// Kullanıcıyı gerçek sistem tarayıcısında Turnstile doğrulamasına götürür,
// doğrulanınca uygulamaya geri döner ve token'ı verir. Gömülü WebView yerine
// gerçek tarayıcı oturumu kullanıldığı için Cloudflare'in "şüpheli ortam"
// tespiti devreye girmiyor (Google girişiyle aynı, kanıtlanmış yöntem).
export async function runCaptcha() {
  const redirectUri = AuthSession.makeRedirectUri();
  const url = `${CAPTCHA_PAGE_URL}?redirect=${encodeURIComponent(redirectUri)}`;

  const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);

  if (result.type !== 'success' || !result.url) {
    return null;
  }

  const match = result.url.match(/[?&]token=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
