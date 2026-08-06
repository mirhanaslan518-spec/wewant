import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useTheme } from "../lib/theme";
import FlowerStage, { FLOWER_VARIANTS } from "../components/FlowerStage";
import Skeleton from "../components/Skeleton";

export default function FlowerScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [status, setStatus] = useState({
    hasPartner: null,
    stage: 1,
    wilted: false,
    variant: "rose",
  });
  const [pickerVisible, setPickerVisible] = useState(false);

  const loadStatus = useCallback(async () => {
    const { data, error } = await supabase.rpc("get_flower_status");
    if (!error && data) {
      setStatus({
        hasPartner: data.has_partner,
        stage: data.stage ?? 1,
        wilted: data.wilted ?? false,
        variant: data.variant || "rose",
      });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatus();
    }, [loadStatus]),
  );

  useEffect(() => {
    const t = setInterval(loadStatus, 30000);
    return () => clearInterval(t);
  }, [loadStatus]);

  const handleSelectVariant = async (key) => {
    setPickerVisible(false);
    const { data, error } = await supabase.rpc("set_flower_variant", {
      p_variant: key,
    });
    if (!error && data.success) {
      setStatus((s) => ({ ...s, variant: key }));
    }
  };

  const styles = createStyles(colors);

  if (status.hasPartner === null) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Skeleton width={220} height={320} borderRadius={16} />
      </View>
    );
  }

  if (status.hasPartner === false) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <FlowerStage
          stage={0}
          gray
          accentColor={colors.accent}
          variant={status.variant}
        />
        <View style={[styles.bottomTextWrap, { bottom: insets.bottom + 24 }]}>
          <Text style={styles.hint}>
            Partnerinle eşleşince çiçeğiniz filizlenmeye başlayacak
          </Text>
        </View>
      </View>
    );
  }

  let hint;
  if (status.wilted) {
    hint = "Çiçek soldu. Yeni çiçek için birbirinize kalp yollayın. ";
  } else if (status.stage === 1) {
    hint = "Partnerinle birbirinize kalp yollayın, yarın çiçek yeşersin.";
  } else if (status.stage === 2) {
    hint =
      "Çiçek yeşermeye başladı. Her gün birbirinize kalp yollamazsanız çiçek yaşayamaz.";
  } else if (status.stage === 3) {
    hint =
      "Bak tomurcuk açtı. Her gün birbirinize kalp yollamazsanız çiçek yaşayamaz.";
  } else if (status.stage === 4) {
    hint =
      "Çiçeğin boyu baya uzamış. Her gün birbirinize kalp yollamazsanız çiçek yaşayamaz.";
  } else if (status.stage === 5) {
    hint =
      "Üçüncü yaprak çıkmış. Her gün birbirinize kalp yollamazsanız çiçek yaşayamaz.";
  } else if (status.stage === 6) {
    hint =
      "Yarın çiçek açacak. Her gün birbirinize kalp yollamazsanız çiçek yaşayamaz.";
  } else if (status.stage === 7) {
    hint =
      "Bak sonunda çiçek açtı. Canlı tutmak için her gün birbirinize kalp yollamaya devam edin.";
  } else {
    hint = `Partnerinle eşleş, birbirinize kalp yollayın, çiçek yeşersin.`;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity
        style={styles.pickButton}
        onPress={() => setPickerVisible(true)}
      >
        <Text style={styles.pickButtonText}>Çiçek Seç</Text>
      </TouchableOpacity>

      <FlowerStage
        stage={status.stage}
        gray={status.wilted}
        accentColor={colors.accent}
        variant={status.variant}
      />

      <View style={[styles.bottomTextWrap, { bottom: insets.bottom + 24 }]}>
        <Text style={styles.hint}>{hint}</Text>
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Bir çiçek seç</Text>
            <ScrollView contentContainerStyle={styles.optionsGrid}>
              {FLOWER_VARIANTS.map((v) => (
                <TouchableOpacity
                  key={v.key}
                  style={[
                    styles.optionCard,
                    status.variant === v.key && styles.optionCardSelected,
                  ]}
                  onPress={() => handleSelectVariant(v.key)}
                >
                  <View style={styles.previewWrap}>
                    <View style={styles.previewScale}>
                      <FlowerStage
                        stage={7}
                        accentColor={colors.accent}
                        variant={v.key}
                      />
                    </View>
                  </View>
                  <Text style={styles.optionName}>{v.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setPickerVisible(false)}
            >
              <Text style={styles.modalCloseText}>Kapat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    bottomTextWrap: {
      position: "absolute",
      alignSelf: "center",
      paddingHorizontal: 40,
    },
    hint: { fontSize: 14, color: colors.textSecondary, textAlign: "center" },
    pickButton: {
      position: "absolute",
      top: 60,
      right: 28,
      alignSelf: "center",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 20,
      paddingVertical: 10,
      paddingHorizontal: 18,
      backgroundColor: colors.surface,
    },
    pickButtonText: {
      color: colors.textPrimary,
      fontSize: 13,
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
      borderRadius: 18,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
      maxHeight: "75%",
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: "700",
      color: colors.textPrimary,
      marginBottom: 14,
    },
    optionsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: 12,
    },
    optionCard: {
      width: "47%",
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 14,
      alignItems: "center",
      paddingVertical: 10,
      backgroundColor: colors.background,
    },
    optionCardSelected: { borderColor: colors.accent, borderWidth: 2 },
    previewWrap: {
      width: 100,
      height: 180,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    previewScale: { transform: [{ scale: 0.32 }], top: 10 },
    optionName: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.textPrimary,
      marginTop: 4,
    },
    modalCloseButton: {
      marginTop: 16,
      alignItems: "center",
      paddingVertical: 10,
    },
    modalCloseText: { color: colors.textSecondary, fontWeight: "600" },
  });
}
