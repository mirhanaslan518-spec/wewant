import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  Switch,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Share,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import Constants from "expo-constants";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme";
import { registerForPushNotifications } from "../lib/notifications";
import Skeleton from "../components/Skeleton";

const ACCENT_SWATCHES = [
  { key: "pink", color: "#dd5396" },
  { key: "blue", color: "#4572bb" },
  { key: "yellow", color: "#fdb818" },
  { key: "purple", color: "#9829ff" },
  { key: "orange", color: "#ff6a00" },
];

export default function SettingsScreen() {
  const { colors, scheme, setScheme, accentColor, setAccentColor } = useTheme();
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [pairingCode, setPairingCode] = useState("");
  const [isPaired, setIsPaired] = useState(false);
  const [partnerCodeInput, setPartnerCodeInput] = useState("");
  const [joining, setJoining] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [justCopied, setJustCopied] = useState(false);

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [togglingNotifications, setTogglingNotifications] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const loadAll = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("pairing_code, display_name, notifications_enabled")
      .eq("id", user.id)
      .single();
    if (profile) {
      setPairingCode(profile.pairing_code);
      setDisplayName(profile.display_name || "");
      setNameInput(profile.display_name || "");
      setNotificationsEnabled(profile.notifications_enabled ?? true);
    }

    const { data: pairings } = await supabase
      .from("pairings")
      .select("id")
      .eq("status", "active")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
    setIsPaired(Boolean(pairings && pairings.length > 0));
  }, []);

  useEffect(() => {
    loadAll().finally(() => setLoading(false));
  }, [loadAll]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
  };

  const handleSaveName = async () => {
    setSavingName(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: nameInput.trim() })
      .eq("id", user.id);
    setSavingName(false);

    if (error) {
      Alert.alert("Hata", error.message);
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
      await Share.share({
        message: `WeWant'te eşleşmek için kodum: ${pairingCode}`,
      });
    } catch (e) {
      // kullanıcı iptal etti
    }
  };

  const handleJoin = async () => {
    if (!partnerCodeInput) return;
    setJoining(true);
    const { data, error } = await supabase.rpc("join_partner", {
      partner_code: partnerCodeInput,
    });
    setJoining(false);

    if (error) {
      Alert.alert("Hata", error.message);
      return;
    }
    if (!data.success) {
      const messages = {
        invalid_code: "Bu kod bulunamadı, tekrar kontrol et.",
        cannot_pair_self: "Kendi kodunu giremezsin.",
        already_paired: "Zaten bir partnerle eşleşmiş durumdasın.",
        partner_already_paired: "Bu kişi zaten başka biriyle eşleşmiş.",
        too_many_attempts:
          "Çok fazla yanlış deneme yaptın. Lütfen 15 dakika sonra tekrar dene.",
      };
      Alert.alert("Eşleşme başarısız", messages[data.error] || data.error);
      return;
    }
    setPartnerCodeInput("");
    await loadAll();
    Alert.alert("Başarılı", "Eşleşme tamamlandı!");
  };

  const handleEndPairing = () => {
    Alert.alert(
      "Emin misin?",
      "Bağlantı sona erecek ve kıvılcım/çiçek geçmişiniz silinecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Sonlandır",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.rpc("end_pairing");
            if (error) {
              Alert.alert("Hata", error.message);
              return;
            }
            await loadAll();
          },
        },
      ],
    );
  };

  const handleToggleNotifications = async (value) => {
    setTogglingNotifications(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (value) {
      await registerForPushNotifications();
      await supabase
        .from("profiles")
        .update({ notifications_enabled: true })
        .eq("id", user.id);
    } else {
      await supabase
        .from("profiles")
        .update({ notifications_enabled: false, expo_push_token: null })
        .eq("id", user.id);
    }

    setNotificationsEnabled(value);
    setTogglingNotifications(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabını silmek istediğine emin misin?",
      "Bu işlem geri alınamaz. Hesabın, eşleşmen ve tüm verilerin (kalp geçmişi, kıvılcım durumları, çiçek) kalıcı olarak silinecek.",
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Hesabımı Sil",
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            const { data, error } = await supabase.rpc("delete_own_account");
            if (error || !data?.success) {
              setDeletingAccount(false);
              Alert.alert(
                "Hata",
                error?.message || "Hesap silinemedi, lütfen tekrar dene.",
              );
              return;
            }
            await supabase.auth.signOut();
          },
        },
      ],
    );
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16 },
        ]}
      >
        <Text style={styles.title}>Ayarlar</Text>
        <Skeleton height={60} borderRadius={14} style={{ marginBottom: 14 }} />
        <Skeleton height={140} borderRadius={14} style={{ marginBottom: 14 }} />
        <Skeleton height={70} borderRadius={14} />
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
      <View style={styles.headerRow}>
        <Text style={styles.title}>Ayarlar</Text>
        <View style={styles.themeToggle}>
          <TouchableOpacity
            style={[
              styles.themeButton,
              scheme === "light" && styles.themeButtonActive,
            ]}
            onPress={() => setScheme("light")}
          >
            <Ionicons
              name="sunny"
              size={15}
              color={scheme === "light" ? "#fff" : colors.textSecondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.themeButton,
              scheme === "dark" && styles.themeButtonActive,
            ]}
            onPress={() => setScheme("dark")}
          >
            <Ionicons
              name="moon"
              size={15}
              color={scheme === "dark" ? "#fff" : colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.sectionLabel}>İSİM</Text>
      <View style={[styles.card, styles.compactCard]}>
        <View style={styles.nameRow}>
          <TextInput
            style={styles.nameInput}
            placeholder="İsmini gir"
            placeholderTextColor={colors.textSecondary}
            value={nameInput}
            onChangeText={setNameInput}
          />
          {nameInput.trim() !== displayName && (
            <TouchableOpacity
              style={styles.nameSaveButton}
              onPress={handleSaveName}
              disabled={savingName}
            >
              {savingName ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.nameSaveText}>Kaydet</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.sectionLabel}>KOD VE BAĞLANTI</Text>
      <View style={styles.card}>
        <Text style={styles.label}>Senin kodun</Text>
        <View style={styles.codeRow}>
          <Text style={styles.code}>{pairingCode}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.smallButton,
                justCopied && styles.smallButtonSuccess,
              ]}
              onPress={handleCopyCode}
            >
              <Text
                style={[
                  styles.smallButtonText,
                  justCopied && styles.smallButtonTextSuccess,
                ]}
              >
                {justCopied ? "✓" : "Kopyala"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.smallButton}
              onPress={handleShareCode}
            >
              <Text style={styles.smallButtonText}>Paylaş</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        {isPaired ? (
          <>
            <Text style={styles.pairedText}>
              ✓ Partnerinle eşleşmiş durumdasın
            </Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleEndPairing}
            >
              <Text style={styles.dangerButtonText}>Bağlantıyı Sonlandır</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Partnerinin kodunu gir</Text>
            <View style={styles.nameRow}>
              <TextInput
                style={styles.nameInput}
                placeholder="Örn: A3F9K2"
                placeholderTextColor={colors.textSecondary}
                autoCapitalize="characters"
                value={partnerCodeInput}
                onChangeText={setPartnerCodeInput}
              />
              <TouchableOpacity
                style={styles.nameSaveButton}
                onPress={handleJoin}
                disabled={joining}
              >
                {joining ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.nameSaveText}>Eşleş</Text>
                )}
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <Text style={styles.sectionLabel}>RENK</Text>
      <View style={[styles.card, styles.compactCard]}>
        <View style={styles.swatchRow}>
          {ACCENT_SWATCHES.map((s) => (
            <TouchableOpacity
              key={s.key}
              onPress={() => setAccentColor(s.key)}
              style={[
                styles.swatch,
                { backgroundColor: s.color },
                accentColor === s.key && styles.swatchSelected,
              ]}
            >
              {accentColor === s.key && (
                <Ionicons name="checkmark" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Text style={styles.sectionLabel}>BİLDİRİMLER</Text>
      <View style={[styles.card, styles.compactCard]}>
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>Bildirimleri Al</Text>
            <Text style={styles.hint}>
              Partnerin kalp gönderdiğinde veya bir buton alevlendiğinde
              haberdar ol.
            </Text>
          </View>
          <Switch
            value={notificationsEnabled}
            onValueChange={handleToggleNotifications}
            disabled={togglingNotifications}
            trackColor={{ true: colors.accent, false: colors.border }}
            thumbColor="#fff"
          />
        </View>
      </View>

      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
        <Text style={styles.signOutButtonText}>Çıkış Yap</Text>
      </TouchableOpacity>

      <Text style={styles.sectionLabel}>GİZLİLİK</Text>
      <View style={[styles.card, styles.compactCard]}>
        <Text style={styles.paragraph}>
          Kalp sinyallerin ve buton geçmişin sadece sen ve eşleştiğin partnerin
          arasında paylaşılır. Bir buton sadece iki taraf da bastığında görünür
          hale gelir; tek taraflı basışlar karşı tarafa hiçbir şekilde
          yansıtılmaz.
        </Text>
      </View>

      <Text style={styles.sectionLabel}>SÜRÜM</Text>
      <View style={[styles.card, styles.compactCard]}>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Sürüm</Text>
          <Text style={styles.rowValue}>
            {Constants.expoConfig?.version || "1.0.0"}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>HESAP</Text>
      <View style={[styles.card, styles.compactCard]}>
        <TouchableOpacity
          style={styles.dangerRow}
          onPress={handleDeleteAccount}
          disabled={deletingAccount}
        >
          {deletingAccount ? (
            <ActivityIndicator color={colors.danger} />
          ) : (
            <Text style={styles.dangerText}>Hesabımı Sil</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 20,
    },
    title: { fontSize: 26, fontWeight: "700", color: colors.textPrimary },
    themeToggle: {
      flexDirection: "row",
      backgroundColor: colors.surface,
      borderRadius: 25,
      padding: 3,
      borderWidth: 3,
      borderColor: colors.border,
    },
    themeButton: {
      width: 35,
      height: 30,
      borderRadius: 30,
      justifyContent: "center",
      alignItems: "center",
    },
    themeButtonActive: { backgroundColor: colors.accent },
    sectionLabel: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.textSecondary,
      letterSpacing: 0.8,
      marginBottom: 8,
      marginTop: 4,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 18,
      borderWidth: 1,
      borderColor: colors.border,
    },
    compactCard: { paddingVertical: 12 },
    label: { fontSize: 13, color: colors.textSecondary, marginBottom: 6 },
    code: {
      fontSize: 26,
      fontWeight: "700",
      letterSpacing: 3,
      color: colors.accent,
    },
    codeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: 8,
    },
    pairedText: {
      fontSize: 15,
      color: colors.success,
      fontWeight: "600",
      marginBottom: 10,
    },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    buttonRow: { flexDirection: "row", gap: 8 },
    nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    nameInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 12,
      fontSize: 15,
      color: colors.textPrimary,
      backgroundColor: colors.background,
    },
    nameSaveButton: {
      backgroundColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 9,
      paddingHorizontal: 16,
    },
    nameSaveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
    rowLabel: { fontSize: 16, color: colors.textPrimary, fontWeight: "500" },
    rowValue: { fontSize: 15, color: colors.textSecondary },
    hint: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 4,
      paddingRight: 12,
    },
    paragraph: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
    smallButton: {
      borderWidth: 1,
      borderColor: colors.accent,
      borderRadius: 10,
      paddingVertical: 8,
      paddingHorizontal: 14,
    },
    smallButtonSuccess: {
      borderColor: colors.success,
      backgroundColor: colors.successMuted,
    },
    smallButtonText: { color: colors.accent, fontWeight: "600", fontSize: 13 },
    smallButtonTextSuccess: { color: colors.success },
    dangerButton: {
      borderRadius: 12,
      padding: 12,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.accent,
    },
    dangerButtonText: { color: colors.accent, fontWeight: "600" },
    signOutButton: {
      borderRadius: 12,
      padding: 14,
      alignItems: "center",
      marginBottom: 18,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    signOutButtonText: {
      color: colors.textPrimary,
      fontWeight: "600",
      fontSize: 15,
    },
    swatchRow: { flexDirection: "row", justifyContent: "space-between" },
    swatch: {
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },
    swatchSelected: { borderColor: colors.textPrimary },
    dangerRow: { paddingVertical: 2 },
    dangerText: { color: colors.danger, fontWeight: "600", fontSize: 15 },
  });
}
