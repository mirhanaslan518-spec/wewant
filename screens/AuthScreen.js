import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { signInWithGoogle } from '../lib/googleAuth';
import { runCaptcha } from '../lib/captcha';

const LOADING_MESSAGES = ['Doğrulanıyor...', 'Hazırlanıyor...', 'Bağlanılıyor...', 'Neredeyse hazır...'];

export default function AuthScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);
  const [infoMsg, setInfoMsg] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (loading) {
      setLoadingMsgIndex(0);
      intervalRef.current = setInterval(() => {
        setLoadingMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length);
      }, 1100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => intervalRef.current && clearInterval(intervalRef.current);
  }, [loading]);

  const handleSubmit = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!email || !password) {
      setErrorMsg('E-posta ve şifre gerekli.');
      return;
    }
    if (isSignUp && !name.trim()) {
      setErrorMsg('İsim gerekli.');
      return;
    }

    setLoading(true);

    const captchaToken = await runCaptcha();
    if (!captchaToken) {
      setLoading(false);
      setErrorMsg('Doğrulama tamamlanmadı, tekrar dene.');
      return;
    }

    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() }, captchaToken },
        })
      : await supabase.auth.signInWithPassword({ email, password, options: { captchaToken } });
    setLoading(false);

    if (error) {
      setErrorMsg(translateAuthError(error.message));
      return;
    }
    if (isSignUp) {
      setInfoMsg('Kayıt başarılı. E-postana gelen onay linkine tıkla, sonra giriş yap.');
    }
  };

  const handleGooglePress = async () => {
    setErrorMsg(null);
    setOauthLoading(true);
    const { error } = await signInWithGoogle();
    setOauthLoading(false);
    if (error) setErrorMsg(error);
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 32 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>WeWant</Text>
        <Text style={styles.subtitle}>{isSignUp ? 'Hesap oluştur' : 'Giriş yap'}</Text>

        <TouchableOpacity style={styles.oauthButton} onPress={handleGooglePress} disabled={oauthLoading}>
          <Text style={styles.oauthButtonText}>Google ile devam et</Text>
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>veya</Text>
          <View style={styles.dividerLine} />
        </View>

        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="İsmin"
            placeholderTextColor={colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="E-posta"
          placeholderTextColor={colors.textSecondary}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}
        {infoMsg && (
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>{infoMsg}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={colors.background} size="small" />
              <Text style={styles.loadingText}>{LOADING_MESSAGES[loadingMsgIndex]}</Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? 'Kayıt Ol' : 'Giriş Yap'}</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setIsSignUp(!isSignUp); setErrorMsg(null); setInfoMsg(null); }}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Kayıt ol'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function translateAuthError(message) {
  if (message.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (message.includes('User already registered')) return 'Bu e-posta zaten kayıtlı, giriş yapmayı dene.';
  if (message.includes('Password should be')) return 'Şifre en az 6 karakter olmalı.';
  if (message.toLowerCase().includes('captcha')) return 'Doğrulama başarısız, tekrar dene.';
  return message;
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
    title: { fontSize: 34, fontWeight: '700', textAlign: 'center', color: colors.accent, letterSpacing: 0.5 },
    subtitle: { fontSize: 15, textAlign: 'center', marginTop: 6, marginBottom: 24, color: colors.textSecondary },
    oauthButton: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      paddingVertical: 15, alignItems: 'center', backgroundColor: colors.surface, marginBottom: 12,
    },
    oauthButtonText: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
    dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { color: colors.textSecondary, fontSize: 12, marginHorizontal: 10 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      padding: 14, marginBottom: 12, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.surface,
    },
    errorBox: {
      backgroundColor: colors.accentMuted, borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 4,
    },
    errorText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
    infoBox: {
      backgroundColor: colors.successMuted, borderRadius: 10, padding: 12, marginTop: 4, marginBottom: 4,
    },
    infoText: { color: colors.success, fontSize: 13, fontWeight: '600' },
    button: {
      backgroundColor: colors.accent, borderRadius: 12, padding: 16,
      alignItems: 'center', marginTop: 10, minHeight: 52, justifyContent: 'center',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    loadingText: { color: colors.background, fontSize: 14, fontWeight: '600' },
    switchText: { textAlign: 'center', marginTop: 22, color: colors.accent, fontSize: 13 },
  });
}
