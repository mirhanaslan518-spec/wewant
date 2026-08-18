import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';

export default function ResetPasswordScreen({ onDone }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleUpdate = async () => {
    setErrorMsg(null);

    if (!password || password.length < 6) {
      setErrorMsg('Şifre en az 6 karakter olmalı.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Şifreler eşleşmiyor.');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message);
      return;
    }
    onDone();
  };

  const styles = createStyles(colors);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <View style={[styles.container, { paddingTop: insets.top + 60 }]}>
        <Text style={styles.title}>Yeni Şifre Belirle</Text>
        <Text style={styles.subtitle}>Hesabın için yeni bir şifre gir.</Text>

        <TextInput
          style={styles.input}
          placeholder="Yeni şifre"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          maxLength={72}
        />
        <TextInput
          style={styles.input}
          placeholder="Yeni şifre (tekrar)"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          maxLength={72}
        />

        {errorMsg && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Şifreyi Güncelle</Text>}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 24 },
    title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 6 },
    subtitle: { fontSize: 14, color: colors.textSecondary, marginBottom: 24 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      padding: 14, marginBottom: 12, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.surface,
    },
    errorBox: { backgroundColor: colors.accentMuted, borderRadius: 10, padding: 12, marginBottom: 12 },
    errorText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
    button: {
      backgroundColor: colors.accent, borderRadius: 12, padding: 16,
      alignItems: 'center', marginTop: 8, minHeight: 52, justifyContent: 'center',
    },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  });
}
