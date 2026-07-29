import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Bu ekran Sprint 3'te kıvılcım/alevlenme butonları ile dolacak.
export default function PartnerScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Partnerim</Text>
      <Text style={styles.subtext}>Hazır butonlar burada olacak (Sprint 3)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
  subtext: { marginTop: 8, color: '#888' },
});
