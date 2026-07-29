import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Bu ekran Sprint 2'de kalp butonu ile dolacak.
export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Ana Sayfa</Text>
      <Text style={styles.subtext}>Kalp butonu burada olacak (Sprint 2)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
  subtext: { marginTop: 8, color: '#888' },
});
