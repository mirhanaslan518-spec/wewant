import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, RefreshControl, ScrollView, Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import Skeleton from '../components/Skeleton';

export default function ProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pairingCode, setPairingCode] = useState('');
  const [isPaired, setIsPaired] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState('');
  const [joining, setJoining] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const loadProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('pairing_code, display_name')
      .eq('id', user.id)
      .single();
    if (profile) {
      setPairingCode(profile.pairing_code);
      setDisplayName(profile.display_name || '');
      setNameInput(profile.display_name || '');
    }

    const { data: pairings } = await supabase
      .from('pairings')
      .select('id')
      .eq('status', 'active')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    setIsPaired(Boolean(pairings && pairings.length > 0));
  }, []);

  useEffect(() => {
    loadProfile().finally(() => setLoading(false));
  }, [loadProfile]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase
      .from('profiles')
      .update({ display_name: nameInput.trim() })
      .eq('id', user.id);
    setSavingName(false);

    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }
    setDisplayName(nameInput.trim());
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(pairingCode);
    setJustCopied(true);
    setTimeout(() => setJustCopied(false), 5000);
  };

  const handleShareCode = async () => {
    try {
      await Share.share({ message: `WeWant'te eşleşmek için kodum: ${pairingCode}` });
    } catch (e) {
      // kullanıcı iptal etti
    }
  };

  const handleJoin = async () => {
    if (!partnerCodeInput) return;
    setJoining(true);
    const { data, error } = await supabase.rpc('join_partner', { partner_code: partnerCodeInput });
    setJoining(false);

    if (error) {
      Alert.alert('Hata', error.message);
      return;
    }
    if (!data.success) {
      const messages = {
        invalid_code: 'Bu kod bulunamadı, tekrar kontrol et.',
        cannot_pair_self: 'Kendi kodunu giremezsin.',
        already_paired: 'Zaten bir partnerle eşleşmiş durumdasın.',
        partner_already_paired: 'Bu kişi zaten başka biriyle eşleşmiş.',
        too_many_attempts: 'Çok fazla yanlış deneme yaptın. Lütfen 15 dakika sonra tekrar dene.',
      };
      Alert.alert('Eşleşme başarısız', messages[data.error] || data.error);
      return;
    }
    setPartnerCodeInput('');
    await loadProfile();
    Alert.alert('Başarılı', 'Eşleşme tamamlandı!');
  };

  const handleEndPairing = () => {
    Alert.alert('Emin misin?', 'Bağlantı sona erecek ve kıvılcım geçmişiniz silinecek.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sonlandır', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.rpc('end_pairing');
          if (error) {
            Alert.alert('Hata', error.message);
            return;
          }
          await loadProfile();
        },
      },
    ]);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Profilim</Text>
        <Skeleton height={100} borderRadius={14} style={{ marginBottom: 16 }} />
        <Skeleton height={110} borderRadius={14} style={{ marginBottom: 16 }} />
        <Skeleton height={90} borderRadius={14} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
    >
      <Text style={styles.title}>Profilim</Text>

      <View style={styles.card}>
        <Text style={styles.label}>İsmin</Text>
        <TextInput
          style={styles.input}
          placeholder="İsmini gir"
          placeholderTextColor={colors.textSecondary}
          value={nameInput}
          onChangeText={setNameInput}
        />
        {nameInput.trim() !== displayName && (
          <TouchableOpacity style={styles.button} onPress={handleSaveName} disabled={savingName}>
            {savingName ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Kaydet</Text>}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Senin eşleşme kodun</Text>
        <Text style={styles.code}>{pairingCode}</Text>
        <View style={styles.row}>
          <TouchableOpacity
            style={[styles.smallButton, justCopied && styles.smallButtonSuccess]}
            onPress={handleCopyCode}
          >
            <Text style={[styles.smallButtonText, justCopied && styles.smallButtonTextSuccess]}>
              {justCopied ? 'Kopyalandı ✓' : 'Kopyala'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.smallButton} onPress={handleShareCode}>
            <Text style={styles.smallButtonText}>Paylaş</Text>
          </TouchableOpacity>
        </View>
      </View>

      {isPaired ? (
        <View style={styles.card}>
          <Text style={styles.label}>Durum</Text>
          <Text style={styles.pairedText}>✓ Partnerinle eşleşmiş durumdasın</Text>
          <TouchableOpacity style={styles.dangerButton} onPress={handleEndPairing}>
            <Text style={styles.dangerButtonText}>Bağlantıyı Sonlandır</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.label}>Partnerinin kodunu gir</Text>
          <TextInput
            style={styles.input}
            placeholder="Örn: A3F9K2"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="characters"
            value={partnerCodeInput}
            onChangeText={setPartnerCodeInput}
          />
          <TouchableOpacity style={styles.button} onPress={handleJoin} disabled={joining}>
            {joining ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Eşleş</Text>}
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity onPress={handleSignOut} style={{ marginTop: 30 }}>
        <Text style={styles.signOutText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
    title: { fontSize: 26, fontWeight: '700', marginBottom: 20, color: colors.textPrimary },
    card: {
      backgroundColor: colors.surface, borderRadius: 16, padding: 18, marginBottom: 16,
      borderWidth: 1, borderColor: colors.border,
    },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
    code: { fontSize: 32, fontWeight: '700', letterSpacing: 4, color: colors.accent },
    pairedText: { fontSize: 16, color: colors.success, fontWeight: '600', marginBottom: 12 },
    input: {
      borderWidth: 1, borderColor: colors.border, borderRadius: 12,
      padding: 14, marginBottom: 12, fontSize: 16, color: colors.textPrimary, backgroundColor: colors.background,
    },
    button: { backgroundColor: colors.accent, borderRadius: 12, padding: 14, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    row: { flexDirection: 'row', marginTop: 12, gap: 10 },
    smallButton: {
      borderWidth: 1, borderColor: colors.accent, borderRadius: 10,
      paddingVertical: 9, paddingHorizontal: 16,
    },
    smallButtonSuccess: { borderColor: colors.success, backgroundColor: colors.successMuted },
    smallButtonText: { color: colors.accent, fontWeight: '600' },
    smallButtonTextSuccess: { color: colors.success },
    dangerButton: { borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: colors.accent },
    dangerButtonText: { color: colors.accent, fontWeight: '600' },
    signOutText: { textAlign: 'center', color: colors.textSecondary },
  });
}
