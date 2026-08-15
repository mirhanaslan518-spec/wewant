import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../lib/theme';
import { AVATAR_GROUPS, AVATAR_CATEGORIES, buildAvatarUrl, cycleCategory, indexForValue } from '../lib/avatar';

export default function AvatarCategoryScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const route = useRoute();
  const { groupKey, userId, onChange } = route.params;

  const [config, setConfig] = useState(route.params.config);

  const group = AVATAR_GROUPS.find((g) => g.key === groupKey);
  const categories = AVATAR_CATEGORIES.filter((c) => group.categories.includes(c.key));

  const handleCycle = (key, direction) => {
    setConfig((prev) => {
      const next = cycleCategory(prev, key, direction);
      onChange(next); // ana ekrandaki config'i de anında güncelle
      return next;
    });
  };

  const styles = createStyles(colors);
  const previewUrl = buildAvatarUrl(config, colors.accent, userId, 200);

  return (
    <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={[styles.previewCircle, { backgroundColor: colors.accent }]}>
        <Image source={{ uri: previewUrl }} style={styles.previewImage} />
      </View>

      {categories.map((cat) => {
        const index = indexForValue(cat, config[cat.key]);
        return (
          <View key={cat.key} style={styles.row}>
            <Text style={styles.rowLabel}>{cat.label}</Text>
            <View style={styles.rowControls}>
              <TouchableOpacity style={styles.arrowButton} onPress={() => handleCycle(cat.key, -1)}>
                <Text style={styles.arrowText}>◀</Text>
              </TouchableOpacity>
              <Text style={styles.rowValue}>{index === 0 ? 'Kapalı' : index}</Text>
              <TouchableOpacity style={styles.arrowButton} onPress={() => handleCycle(cat.key, 1)}>
                <Text style={styles.arrowText}>▶</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    container: { padding: 24, backgroundColor: colors.background, flexGrow: 1 },
    previewCircle: {
      width: 150, height: 150, borderRadius: 75, alignSelf: 'center',
      marginBottom: 24, justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
    },
    previewImage: { width: 150, height: 150 },
    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      backgroundColor: colors.surface, borderRadius: 12, borderWidth: 1, borderColor: colors.border,
      paddingVertical: 14, paddingHorizontal: 16, marginBottom: 12,
    },
    rowLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
    rowControls: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    arrowButton: { padding: 4 },
    arrowText: { fontSize: 16, color: colors.accent, fontWeight: '700' },
    rowValue: { fontSize: 14, color: colors.textSecondary, minWidth: 44, textAlign: 'center' },
  });
}
