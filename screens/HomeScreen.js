import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme";
import Skeleton from "../components/Skeleton";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const COOLDOWN_MS = 10000;
const BEATING_WINDOW_MS = 60 * 60 * 1000; // 1 saat
const GLOW_REST_ALPHA = 0.2;
const GLOW_BURST_ALPHA = 1;

function hexToRgba(hex, alpha) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export default function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [heartStatus, setHeartStatus] = useState({
    hasPartner: null,
    lastHeartAt: null,
    lastSentByMeAt: null,
  });
  const [sentFeedback, setSentFeedback] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [glowAlpha, setGlowAlpha] = useState(GLOW_REST_ALPHA);

  const pressScale = useRef(new Animated.Value(1)).current;
  const beatScale = useRef(new Animated.Value(1)).current;
  const burst = useRef(new Animated.Value(GLOW_REST_ALPHA)).current;

  useEffect(() => {
    const id = burst.addListener(({ value }) => setGlowAlpha(value));
    return () => burst.removeListener(id);
  }, [burst]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const loadHeartStatus = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_heart_status");
    if (!error && data) {
      setHeartStatus({
        hasPartner: data.has_partner,
        lastHeartAt: data.last_heart_at,
        lastSentByMeAt: data.last_sent_by_me_at,
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHeartStatus();
    }, [loadHeartStatus]),
  );

  useEffect(() => {
    let channel;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      channel = supabase
        .channel("heart-signals-listener")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "heart_signals",
            filter: `receiver_id=eq.${user.id}`,
          },
          async () => {
            await Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success,
            );
            setHeartStatus((s) => ({
              ...s,
              lastHeartAt: new Date().toISOString(),
            }));
          },
        )
        .subscribe();
    })();
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const isBeating = Boolean(
    heartStatus.hasPartner &&
    heartStatus.lastHeartAt &&
    now - new Date(heartStatus.lastHeartAt).getTime() < BEATING_WINDOW_MS,
  );
  const isInactive = Boolean(heartStatus.hasPartner && !isBeating);
  const cooldownRemaining = heartStatus.lastSentByMeAt
    ? Math.max(
        0,
        Math.ceil(
          (COOLDOWN_MS -
            (now - new Date(heartStatus.lastSentByMeAt).getTime())) /
            1000,
        ),
      )
    : 0;

  useEffect(() => {
    let loop;
    if (isBeating) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(beatScale, {
            toValue: 1.12,
            duration: 160,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(beatScale, {
            toValue: 1,
            duration: 160,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(beatScale, {
            toValue: 1.08,
            duration: 140,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(beatScale, {
            toValue: 1,
            duration: 140,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.delay(650),
        ]),
      );
      loop.start();
    } else {
      beatScale.setValue(1);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [isBeating, beatScale]);

  const triggerBurst = () => {
    burst.stopAnimation();
    burst.setValue(GLOW_BURST_ALPHA);
    Animated.timing(burst, {
      toValue: GLOW_REST_ALPHA,
      duration: COOLDOWN_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const handlePress = async () => {
    if (!heartStatus.hasPartner || cooldownRemaining > 0) return;

    Animated.sequence([
      Animated.timing(pressScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pressScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const { data, error } = await supabase.rpc("send_heart");

    if (!error && data.success) {
      const nowIso = new Date().toISOString();
      setHeartStatus((s) => ({
        ...s,
        lastHeartAt: nowIso,
        lastSentByMeAt: nowIso,
      }));
      triggerBurst();
      setSentFeedback(true);
      setTimeout(() => setSentFeedback(false), 1500);
    }
  };

  const styles = createStyles(colors);

  if (heartStatus.hasPartner === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Skeleton width={180} height={180} borderRadius={90} />
      </View>
    );
  }

  const showGlow = heartStatus.hasPartner && isBeating;
  const isGray = !heartStatus.hasPartner || isInactive;

  let bottomText = null;
  if (sentFeedback) bottomText = "Gönderildi";
  else if (heartStatus.hasPartner && cooldownRemaining > 0)
    bottomText = `${cooldownRemaining} sn sonra tekrar gönderebilirsin`;
  else if (!heartStatus.hasPartner)
    bottomText = "Partnerinle eşleşince aktif olacak";
  else if (isInactive) bottomText = "Kalbe bas!";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.glowWrap}>
        <TouchableOpacity
          onPress={handlePress}
          activeOpacity={
            heartStatus.hasPartner && cooldownRemaining === 0 ? 0.85 : 1
          }
          disabled={!heartStatus.hasPartner || cooldownRemaining > 0}
        >
          <Animated.View
            style={[
              styles.heart,
              {
                backgroundColor: isGray
                  ? colors.surfaceElevated
                  : colors.accent,
                borderWidth: isGray ? 1 : 0,
                borderColor: colors.border,
                transform: [
                  { scale: Animated.multiply(pressScale, beatScale) },
                ],
                boxShadow: showGlow
                  ? `0px 0px 300px 200px ${hexToRgba(colors.accent, glowAlpha)}`
                  : undefined,
              },
            ]}
          >
            <Text
              style={[
                styles.heartIcon,
                { color: isGray ? colors.textSecondary : "#fff" },
              ]}
            >
              ♥
            </Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {bottomText && (
        <View style={[styles.bottomTextWrap, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.bottomText}>{bottomText}</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    glowWrap: { justifyContent: "center", alignItems: "center" },
    heart: {
      width: 180,
      height: 180,
      borderRadius: 90,
      justifyContent: "center",
      alignItems: "center",
    },
    heartIcon: { fontSize: 80 },
    bottomTextWrap: {
      position: "absolute",
      alignSelf: "center",
      paddingHorizontal: 40,
    },
    bottomText: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });
}
