import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';

// Uygulama açıkken bildirim gelirse sade bir şekilde göster
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function HomeScreen() {
  const [hasPartner, setHasPartner] = useState(null); // null = kontrol ediliyor
  const [sentFeedback, setSentFeedback] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let channel;

    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pairings } = await supabase
        .from('pairings')
        .select('id')
        .eq('status', 'active')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      setHasPartner(Boolean(pairings && pairings.length > 0));

      // Partnerden gelen kalp sinyallerini anlık dinle (uygulama açıkken anında titreşim için).
      // Bildirim banner'ı artık gerçek push bildirimi ile geliyor (Sprint 5),
      // bu yüzden burada sadece dokunsal geri bildirim veriyoruz.
      channel = supabase
        .channel('heart-signals-listener')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'heart_signals',
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        )
        .subscribe();
    };

    setup();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const handlePress = async () => {
    if (!hasPartner) return;

    Animated.sequence([
      Animated.timing(scale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await supabase.rpc('send_heart');

    setSentFeedback(true);
    setTimeout(() => setSentFeedback(false), 1500);
  };

  if (hasPartner === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>Önce Profilim sekmesinden{'\n'}partnerinle eşleşmelisin.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
        <Animated.View style={[styles.heart, { transform: [{ scale }] }]}>
          <Text style={styles.heartIcon}>♥</Text>
        </Animated.View>
      </TouchableOpacity>
      {sentFeedback && <Text style={styles.feedback}>Gönderildi</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  heart: {
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: '#e0245e', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#e0245e', shadowOpacity: 0.3, shadowRadius: 20, shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heartIcon: { fontSize: 80, color: '#fff' },
  feedback: { marginTop: 24, fontSize: 16, color: '#888' },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#888', paddingHorizontal: 40 },
});
