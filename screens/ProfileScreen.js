import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

// Bu ekran Sprint 1 ve 4'te eşleşme kodu ile dolacak.
export default function ProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Profilim</Text>
      <Text style={styles.subtext}>Eşleşme kodu burada olacak (Sprint 1-4)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  text: { fontSize: 24, fontWeight: 'bold' },
  subtext: { marginTop: 8, color: '#888' },
});
