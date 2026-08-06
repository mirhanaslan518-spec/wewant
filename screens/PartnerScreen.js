import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme";
import Skeleton from "../components/Skeleton";

const BUTTONS = [
  { type: "make_up", label: "Barışalım mı?", emoji: "🕊️" },
  { type: "eat_out", label: "Bugün dışarıda yemek yiyelim mi?", emoji: "🍽️" },
  { type: "miss_you", label: "Seni özledim.", emoji: "🤍" },
  { type: "spend_time", label: "Birlikte vakit geçirelim mi?", emoji: "⏳" },
];

const FOOD_OPTIONS = [
  { key: "pizza", label: "Pizza", emoji: "🍕" },
  { key: "hamburger", label: "Hamburger", emoji: "🍔" },
  { key: "kebap", label: "Kebap", emoji: "🥙" },
  { key: "other", label: "Diğer", emoji: "🍜" },
];

const POLL_INTERVAL_MS = 15000;
const NEON_DURATION_MS = 60000;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

function elapsedHoursLabel(startedAt) {
  if (!startedAt) return null;
  const hours = Math.floor(
    (Date.now() - new Date(startedAt).getTime()) / (1000 * 60 * 60),
  );
  if (hours < 1) return null;
  return `${hours}s`;
}

function useNeonBlink(colors) {
  const [neonActive, setNeonActive] = useState(false);
  const blink = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let loop;
    if (neonActive) {
      loop = Animated.loop(
        Animated.sequence([
          Animated.timing(blink, {
            toValue: 1,
            duration: 500,
            useNativeDriver: false,
          }),
          Animated.timing(blink, {
            toValue: 0,
            duration: 500,
            useNativeDriver: false,
          }),
        ]),
      );
      loop.start();
    } else {
      blink.setValue(0);
    }
    return () => {
      if (loop) loop.stop();
    };
  }, [neonActive, blink]);

  const neonBg = blink.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.success, "#5CF291"],
  });
  return { neonActive, setNeonActive, neonBg };
}

function SparkButton({
  label,
  emoji,
  info,
  pressing,
  onPress,
  onDelete,
  colors,
  styles,
}) {
  const status = info.status || "none";
  const isIgnited = status === "ignited";
  const isPendingByMe = status === "pending_by_me";
  const timerLabel = isPendingByMe ? elapsedHoursLabel(info.started_at) : null;
  const { neonActive, setNeonActive, neonBg } = useNeonBlink(colors);

  useEffect(() => {
    if (isIgnited && info.ignited_at) {
      const elapsed = Date.now() - new Date(info.ignited_at).getTime();
      if (elapsed < NEON_DURATION_MS) {
        setNeonActive(true);
        const t = setTimeout(
          () => setNeonActive(false),
          NEON_DURATION_MS - elapsed,
        );
        return () => clearTimeout(t);
      }
    }
    setNeonActive(false);
  }, [isIgnited, info.ignited_at]);

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        isPendingByMe && styles.buttonPending,
        isIgnited && {
          backgroundColor: neonActive ? neonBg : colors.success,
          borderColor: colors.success,
        },
      ]}
      onPress={() => {
        if (!isIgnited) onPress();
      }}
      disabled={pressing}
      activeOpacity={0.8}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.buttonText, isIgnited && styles.buttonTextIgnited]}>
        {label}
      </Text>
      {isPendingByMe && (
        <Text style={styles.pendingLabel}>Kıvılcım çakıldı⚡️</Text>
      )}
      {isIgnited && <Text style={styles.ignitedLabel}>Alev aldı🔥</Text>}
      {onDelete && (
        <TouchableOpacity
          style={styles.deleteBadge}
          onPress={onDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text
            style={[styles.deleteBadgeText, isIgnited && { color: "#fff" }]}
          >
            ×
          </Text>
        </TouchableOpacity>
      )}
      {timerLabel && (
        <View style={styles.timerBadge}>
          <Text style={styles.timerText}>{timerLabel}</Text>
        </View>
      )}
    </AnimatedTouchable>
  );
}

function FoodChoiceButton({ colors, styles }) {
  const [expanded, setExpanded] = useState(false);
  const [foodStatus, setFoodStatus] = useState({
    status: "none",
    my_choice: null,
    partner_choice: null,
  });
  const [choosing, setChoosing] = useState(null);
  const pollRef = useRef(null);

  const loadFoodStatus = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_food_status");
    if (!error && data) setFoodStatus(data);
  }, []);

  useEffect(() => {
    loadFoodStatus();
    pollRef.current = setInterval(loadFoodStatus, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadFoodStatus]);

  useFocusEffect(
    useCallback(() => {
      loadFoodStatus();
    }, [loadFoodStatus]),
  );

  const locked = Boolean(foodStatus.my_choice);

  const handleChoose = async (choiceKey) => {
    if (locked) return;
    setChoosing(choiceKey);
    const { data, error } = await supabase.rpc("choose_food", {
      p_choice: choiceKey,
    });
    setChoosing(null);
    if (!error && data.success) {
      if (data.status === "match") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await loadFoodStatus();
    }
  };

  const partnerLabel = FOOD_OPTIONS.find(
    (o) => o.key === foodStatus.partner_choice,
  )?.label;

  return (
    <View style={styles.foodCard}>
      <TouchableOpacity
        style={styles.foodHeader}
        onPress={() => setExpanded((e) => !e)}
        activeOpacity={0.8}
      >
        <Text style={styles.emoji}>🍽️</Text>
        <Text style={styles.buttonText}>Ne yiyelim?</Text>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={styles.foodOptionsRow}>
            {FOOD_OPTIONS.map((opt) => {
              const isMine = foodStatus.my_choice === opt.key;
              const isMatch = isMine && foodStatus.status === "match";
              const isMismatch = isMine && foodStatus.status === "mismatch";
              const isWaiting =
                isMine && foodStatus.status === "waiting_partner";
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.foodOption,
                    isWaiting && styles.buttonPending,
                    isMatch && {
                      backgroundColor: colors.success,
                      borderColor: colors.success,
                    },
                    isMismatch && {
                      backgroundColor: colors.danger,
                      borderColor: colors.danger,
                    },
                    locked && !isMine && { opacity: 0.4 },
                  ]}
                  onPress={() => handleChoose(opt.key)}
                  disabled={choosing === opt.key || locked}
                >
                  <Text style={styles.foodEmoji}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.foodLabel,
                      (isMatch || isMismatch) && { color: "#fff" },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {foodStatus.status === "waiting_partner" && (
            <Text style={styles.foodHint}>Partnerin henüz seçmedi.</Text>
          )}
          {foodStatus.status === "match" && (
            <Text style={[styles.foodHint, { color: colors.success }]}>
              Eşleşti! 🎉
            </Text>
          )}
          {foodStatus.status === "mismatch" && partnerLabel && (
            <Text style={styles.foodHint}>Partnerin: {partnerLabel}</Text>
          )}
        </>
      )}
    </View>
  );
}

function AddCustomButtonModal({ visible, onClose, onSubmit, colors, styles }) {
  const [label, setLabel] = useState("");

  const handleAdd = () => {
    if (!label.trim()) return;
    onSubmit(label.trim());
    setLabel("");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>Yeni buton ekle</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Örn: Film izleyelim mi?"
            placeholderTextColor={colors.textSecondary}
            value={label}
            onChangeText={setLabel}
            autoFocus
          />
          <View style={styles.modalRow}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={onClose}
            >
              <Text style={styles.modalCancelText}>İptal</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalAddButton} onPress={handleAdd}>
              <Text style={styles.modalAddText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PartnerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [hasPartner, setHasPartner] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [customButtons, setCustomButtons] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [pressing, setPressing] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const pollRef = useRef(null);

  const loadStatus = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_spark_status");
    if (!error && Array.isArray(data)) {
      const map = {};
      data.forEach((item) => {
        map[item.button_type] = item;
      });
      setStatuses(map);
    }
  }, []);

  const loadCustomButtons = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_custom_spark_statuses");
    if (!error && Array.isArray(data)) setCustomButtons(data);
  }, []);

  const checkPartner = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data: pairings } = await supabase
      .from("pairings")
      .select("id")
      .eq("status", "active")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    setHasPartner(Boolean(pairings && pairings.length > 0));
  }, []);

  useEffect(() => {
    loadStatus();
    loadCustomButtons();
    pollRef.current = setInterval(() => {
      loadStatus();
      loadCustomButtons();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [loadStatus, loadCustomButtons]);

  useFocusEffect(
    useCallback(() => {
      checkPartner();
      loadStatus();
      loadCustomButtons();
    }, [checkPartner, loadStatus, loadCustomButtons]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([checkPartner(), loadStatus(), loadCustomButtons()]);
    setRefreshing(false);
  };

  const handlePress = async (buttonType) => {
    setPressing(buttonType);
    const { data, error } = await supabase.rpc("press_spark", {
      p_button_type: buttonType,
    });
    setPressing(null);
    if (!error && data.success) {
      if (data.status === "ignited") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await loadStatus();
    }
  };

  const handleCustomPress = async (buttonId) => {
    setPressing(buttonId);
    const { data, error } = await supabase.rpc("press_custom_spark", {
      p_button_id: buttonId,
    });
    setPressing(null);
    if (!error && data.success) {
      if (data.status === "ignited") {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } else {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await loadCustomButtons();
    }
  };

  const handleAddCustomButton = async (label) => {
    setModalVisible(false);
    const { data, error } = await supabase.rpc("add_custom_button", {
      p_label: label,
    });
    if (!error && data.success) {
      await loadCustomButtons();
    }
  };

  const confirmDeleteCustomButton = (buttonId) => {
    Alert.alert("Butonu silmek istiyor musunuz?", "", [
      { text: "Hayır", style: "cancel" },
      {
        text: "Evet",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase.rpc("delete_custom_button", {
            p_button_id: buttonId,
          });
          if (!error) await loadCustomButtons();
        },
      },
    ]);
  };

  const styles = createStyles(colors);

  if (hasPartner === null) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={styles.title}>Partnerim</Text>
        {[0, 1, 2, 3].map((i) => (
          <Skeleton
            key={i}
            height={70}
            borderRadius={14}
            style={{ marginBottom: 14 }}
          />
        ))}
      </ScrollView>
    );
  }

  if (hasPartner === false) {
    return (
      <ScrollView
        contentContainerStyle={[styles.centered, { paddingTop: insets.top }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles.emptyText}>
          Önce Profilim sekmesinden{"\n"}partnerinle eşleşmelisin.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 16 },
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
    >
      <Text style={styles.title}>Partnerim</Text>

      {BUTTONS.map((btn) => (
        <SparkButton
          key={btn.type}
          label={btn.label}
          emoji={btn.emoji}
          info={statuses[btn.type] || {}}
          pressing={pressing === btn.type}
          onPress={() => handlePress(btn.type)}
          colors={colors}
          styles={styles}
        />
      ))}

      <FoodChoiceButton colors={colors} styles={styles} />

      {customButtons.map((btn) => (
        <SparkButton
          key={btn.id}
          label={btn.label}
          emoji="✨"
          info={btn}
          pressing={pressing === btn.id}
          onPress={() => handleCustomPress(btn.id)}
          onDelete={() => confirmDeleteCustomButton(btn.id)}
          colors={colors}
          styles={styles}
        />
      ))}

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>

      <AddCustomButtonModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={handleAddCustomButton}
        colors={colors}
        styles={styles}
      />
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
    centered: {
      flexGrow: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: 40,
      backgroundColor: colors.background,
    },
    title: {
      fontSize: 26,
      fontWeight: "700",
      marginBottom: 20,
      color: colors.textPrimary,
    },
    emptyText: {
      textAlign: "center",
      fontSize: 16,
      color: colors.textSecondary,
    },
    button: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      marginBottom: 14,
      minHeight: 76,
      justifyContent: "center",
      borderWidth: 1,
      borderColor: colors.border,
    },
    buttonPending: {
      backgroundColor: colors.accentMuted,
      borderColor: colors.accentSoft,
    },
    emoji: { fontSize: 22, marginBottom: 6 },
    buttonText: {
      fontSize: 16,
      fontWeight: "600",
      color: colors.textPrimary,
      paddingRight: 30,
    },
    buttonTextIgnited: { color: "#fff" },
    pendingLabel: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: "600",
      marginTop: 6,
    },
    ignitedLabel: {
      fontSize: 12,
      color: "#fff",
      fontWeight: "700",
      marginTop: 6,
    },
    timerBadge: {
      position: "absolute",
      right: 14,
      bottom: 12,
      backgroundColor: "rgba(0,0,0,0.18)",
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    timerText: { fontSize: 12, fontWeight: "700", color: colors.textPrimary },
    deleteBadge: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: "rgba(0,0,0,0.12)",
      justifyContent: "center",
      alignItems: "center",
    },
    deleteBadgeText: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.textSecondary,
      lineHeight: 18,
    },
    foodCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },
    foodHeader: { padding: 20, minHeight: 76, justifyContent: "center" },
    foodOptionsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 16,
      gap: 10,
    },
    foodOption: {
      width: "47%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      backgroundColor: colors.background,
    },
    foodEmoji: { fontSize: 20, marginBottom: 4 },
    foodLabel: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
    foodHint: {
      fontSize: 12,
      color: colors.textSecondary,
      paddingHorizontal: 16,
      paddingBottom: 16,
    },
    addButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderStyle: "dashed",
      borderRadius: 16,
      paddingVertical: 14,
      alignItems: "center",
      marginBottom: 24,
    },
    addButtonText: {
      fontSize: 22,
      color: colors.textSecondary,
      fontWeight: "600",
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      padding: 24,
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 14,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      padding: 14,
      fontSize: 16,
      color: colors.textPrimary,
      backgroundColor: colors.background,
      marginBottom: 16,
    },
    modalRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
    modalCancelButton: { paddingVertical: 10, paddingHorizontal: 16 },
    modalCancelText: { color: colors.textSecondary, fontWeight: "600" },
    modalAddButton: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 20,
    },
    modalAddText: { color: "#fff", fontWeight: "700" },
  });
}
