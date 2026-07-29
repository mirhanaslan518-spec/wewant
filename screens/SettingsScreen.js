import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Bu ekran ileriki sprintlerde dolacak (Sprint 8).
export default function SettingsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ayarlar</Text>
      <Text style={styles.subtext}>Yakında (Sprint 8)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
  subtext: { marginTop: 8, color: '#888' },
});
