import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image,
  ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTheme } from '../lib/theme';
import { AVATAR_GROUPS, DEFAULT_AVATAR_CONFIG, buildAvatarUrl } from '../lib/avatar';
import Skeleton from '../components/Skeleton';

export default function AvatarEditorScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState(null);
  const [config, setConfig] = useState(DEFAULT_AVATAR_CONFIG);
  const [remaining, setRemaining] = useState(2);

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_config')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_config && Object.keys(profile.avatar_config).length > 0) {
      setConfig({ ...DEFAULT_AVATAR_CONFIG, ...profile.avatar_config });
    }

    const { data: status } = await supabase.rpc('get_avatar_change_status');
    if (status) setRemaining(status.remaining);
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    const { data, error } = await supabase.rpc('save_avatar_config', { p_config: config });
    setSaving(false);

    if (error || !data?.success) {
      if (data?.error === 'daily_limit_reached') {
        Alert.alert('Günlük hak doldu', 'Avatarınızı günde en fazla 2 kere değiştirebilirsiniz. Yarın tekrar dene.');
      } else {
        Alert.alert('Hata', error?.message || 'Kaydedilemedi, tekrar dene.');
      }
      return;
    }
    setRemaining(data.remaining);
    navigation.goBack();
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
        <Skeleton width={180} height={180} borderRadius={90} style={{ alignSelf: 'center', marginBottom: 24 }} />
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} height={56} borderRadius={12} style={{ marginBottom: 12 }} />
        ))}
      </ScrollView>
    );
  }

  const previewUrl = buildAvatarUrl(config, colors.accent, userId, 240);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={[styles.previewCircle, { backgroundColor: colors.accent }]}>
        <Image source={{ uri: previewUrl }} style={styles.previewImage} />
      </View>

      {AVATAR_GROUPS.map((group) => (
        <TouchableOpacity
          key={group.key}
          style={styles.groupRow}
          onPress={() => navigation.navigate('AvatarCategory', {
            groupKey: group.key,
            config,
            userId,
            onChange: setConfig,
          })}
        >
          <Text style={styles.groupLabel}>{group.label}</Text>
          <Text style={styles.groupChevron}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving || remaining <= 0}>
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveButtonText}>Kaydet</Text>}
      </TouchableOpacity>
      <Text style={[styles.limitText, remaining <= 0 && { color: colors.danger, fontWeight: '600' }]}>
        {remaining > 0
          ? 'Avatarınızı günde sadece 2 kere değiştirebilirsiniz.'
          : 'Bugünkü değiştirme hakkını kullandın, yarın tekrar deneyebilirsin.'}
      </Text>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
    previewCircle: {
      width: 180, height: 180, borderRadius: 90, alignSelf: 'center',
      marginBottom: 28, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    previewImage: { width: 180, height: 180 },
    groupRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 16, paddingHorizontal: 16, marginBottom: 12,
    },
    groupLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
    groupChevron: { fontSize: 20, color: colors.textSecondary },
    saveButton: {
      backgroundColor: colors.accent, borderRadius: 12, padding: 16,
      alignItems: 'center', marginTop: 12,
    },
    saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    limitText: { textAlign: 'center', color: colors.textSecondary, fontSize: 12, marginTop: 10, marginBottom: 20 },
  });
}
