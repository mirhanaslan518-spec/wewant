import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '../lib/supabase';

const BUTTONS = [
  { type: 'make_up', label: 'Barışalım mı?' },
  { type: 'eat_out', label: 'Bugün dışarıda yemek yiyelim mi?' },
  { type: 'miss_you', label: 'Seni özledim.' },
  { type: 'spend_time', label: 'Birlikte vakit geçirelim mi?' },
];

const POLL_INTERVAL_MS = 15000;

export default function PartnerScreen() {
  const [hasPartner, setHasPartner] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [pressing, setPressing] = useState(null);
  const pollRef = useRef(null);

  const loadStatus = useCallback(async () => {
    const { data, error } = await supabase.rpc('get_spark_status');
    if (!error && Array.isArray(data)) {
      const map = {};
      data.forEach((item) => { map[item.button_type] = item; });
      setStatuses(map);
    }
  }, []);

  const checkPartner = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: pairings } = await supabase
      .from('pairings')
      .select('id')
      .eq('status', 'active')
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    setHasPartner(Boolean(pairings && pairings.length > 0));
  }, []);

  useEffect(() => {
    checkPartner();
    loadStatus();

    pollRef.current = setInterval(loadStatus, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [checkPartner, loadStatus]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkPartner(), loadStatus()]);
    setRefreshing(false);
  };

  const handlePress = async (buttonType) => {
    setPressing(buttonType);
    const { data, error } = await supabase.rpc('press_spark', { p_button_type: buttonType });
    setPressing(null);

    if (!error && data.success) {
      if (data.status === 'ignited') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await loadStatus();
    }
  };

  if (hasPartner === false) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>Önce Profilim sekmesinden{'\n'}partnerinle eşleşmelisin.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Partnerim</Text>
      {BUTTONS.map((btn) => {
        const status = statuses[btn.type]?.status || 'none';
        const isIgnited = status === 'ignited';
        return (
          <TouchableOpacity
            key={btn.type}
            style={[styles.button, isIgnited && styles.buttonIgnited]}
            onPress={() => handlePress(btn.type)}
            disabled={pressing === btn.type || isIgnited}
          >
            <Text style={[styles.buttonText, isIgnited && styles.buttonTextIgnited]}>
              {btn.label}
            </Text>
            {isIgnited && <Text style={styles.ignitedTag}>🔥 Alevlendi</Text>}
            {status === 'pending_by_me' && (
              <Text style={styles.pendingTag}>İletildi</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 20 },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#888' },
  button: {
    backgroundColor: '#faf5f6', borderRadius: 14, padding: 20, marginBottom: 14,
    minHeight: 70, justifyContent: 'center',
  },
  buttonIgnited: { backgroundColor: '#2e8b57' },
  buttonText: { fontSize: 16, fontWeight: '600', color: '#222' },
  buttonTextIgnited: { color: '#fff' },
  ignitedTag: { marginTop: 6, color: '#fff', fontSize: 13, fontWeight: '600' },
  pendingTag: { marginTop: 6, color: '#aaa', fontSize: 12 },
});
