import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
  KeyboardAvoidingView, ScrollView, Platform, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { signInWithGoogle } from '../lib/googleAuth';
import { requestPasswordReset } from '../lib/passwordReset';

const PRIVACY_URL = 'https://mirhanaslan518-spec.github.io/wewant/privacy.html';
const TERMS_URL = 'https://mirhanaslan518-spec.github.io/wewant/terms.html';

const LOADING_MESSAGES = ['Hazırlanıyor...', 'Bağlanılıyor...', 'Neredeyse hazır...'];

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
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
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
    if (isSignUp && !agreedToTerms) {
      setErrorMsg('Devam etmek için Gizlilik Politikası ve Kullanım Şartlarını kabul etmelisin.');
      return;
    }

    setLoading(true);

    const { error } = isSignUp
      ? await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name.trim() } },
        })
      : await supabase.auth.signInWithPassword({ email, password });
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
    if (isSignUp && !agreedToTerms) {
      setErrorMsg('Devam etmek için Gizlilik Politikası ve Kullanım Şartlarını kabul etmelisin.');
      return;
    }
    setOauthLoading(true);
    const { error } = await signInWithGoogle();
    setOauthLoading(false);
    if (error) setErrorMsg(error);
  };

  const handleResetRequest = async () => {
    setErrorMsg(null);
    setInfoMsg(null);

    if (!resetEmail) {
      setErrorMsg('E-posta gerekli.');
      return;
    }

    setResetLoading(true);
    const { error } = await requestPasswordReset(resetEmail);
    setResetLoading(false);

    if (error) {
      setErrorMsg(error);
      return;
    }
    setInfoMsg('Sıfırlama bağlantısını e-postana gönderdik. Gelen kutunu kontrol et.');
  };

  const styles = createStyles(colors);

  if (showForgotPassword) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, backgroundColor: colors.background }}
      >
        <ScrollView
          contentContainerStyle={[styles.container, { paddingTop: insets.top + 32 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>Şifreni Sıfırla</Text>
          <Text style={styles.subtitle}>E-postana bir sıfırlama bağlantısı gönderelim.</Text>

          <TextInput
            style={styles.input}
            placeholder="E-posta"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            keyboardType="email-address"
            value={resetEmail}
            onChangeText={setResetEmail}
            maxLength={100}
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

          <TouchableOpacity style={styles.button} onPress={handleResetRequest} disabled={resetLoading}>
            {resetLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sıfırlama Bağlantısı Gönder</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setShowForgotPassword(false); setErrorMsg(null); setInfoMsg(null); }}>
            <Text style={styles.switchText}>Girişe geri dön</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

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
            maxLength={30}
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
          maxLength={100}
        />
        <TextInput
          style={styles.input}
          placeholder="Şifre"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          maxLength={72}
        />

        {isSignUp && (
          <TouchableOpacity
            style={styles.consentRow}
            onPress={() => setAgreedToTerms((v) => !v)}
            activeOpacity={0.8}
          >
            <View style={[styles.checkbox, agreedToTerms && { backgroundColor: colors.accent, borderColor: colors.accent }]}>
              {agreedToTerms && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.consentText}>
              <Text onPress={() => Linking.openURL(PRIVACY_URL)} style={styles.consentLink}>Gizlilik Politikası</Text>
              {' '}ve{' '}
              <Text onPress={() => Linking.openURL(TERMS_URL)} style={styles.consentLink}>Kullanım Şartlarını</Text>
              {' '}okudum, kabul ediyorum.
            </Text>
          </TouchableOpacity>
        )}

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

        <TouchableOpacity
          style={[styles.button, isSignUp && !agreedToTerms && { opacity: 0.5 }]}
          onPress={handleSubmit}
          disabled={loading || (isSignUp && !agreedToTerms)}
        >
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

        {!isSignUp && (
          <TouchableOpacity onPress={() => { setShowForgotPassword(true); setResetEmail(email); setErrorMsg(null); setInfoMsg(null); }}>
            <Text style={styles.forgotText}>Şifremi unuttum?</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function translateAuthError(message) {
  if (message.includes('Invalid login credentials')) return 'E-posta veya şifre hatalı.';
  if (message.includes('User already registered')) return 'Bu e-posta zaten kayıtlı, giriş yapmayı dene.';
  if (message.includes('Password should be')) return 'Şifre en az 6 karakter olmalı.';
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
    forgotText: { textAlign: 'center', marginTop: 14, color: colors.textSecondary, fontSize: 13 },
    consentRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 4, marginBottom: 4, gap: 10 },
    checkbox: {
      width: 20, height: 20, borderRadius: 5, borderWidth: 1.5, borderColor: colors.border,
      justifyContent: 'center', alignItems: 'center', marginTop: 1,
    },
    consentText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
    consentLink: { color: colors.accent, fontWeight: '600' },
  });
}
