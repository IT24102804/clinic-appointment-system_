import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function DoctorHomeScreen() {
  const { user, logout } = useAuth();
  const [busy, setBusy] = useState(false);

  const handleLogout = async () => {
    if (busy) return;
    try {
      setBusy(true);
      await logout();
      router.replace('/' as any);
    } catch (e: any) {
      Alert.alert('Logout Failed', e?.message || 'Unable to logout');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.kicker}>Doctor Portal</Text>
        <Text style={styles.title}>Welcome, Dr. {user?.firstName} {user?.lastName}</Text>
        <Text style={styles.subtitle}>{user?.email}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <Text style={styles.muted}>You have no appointments loaded yet.</Text>
      </View>

      <Pressable
        onPress={() => router.push('/account/profile' as any)}
        style={styles.card}>
        <Text style={styles.cardTitle}>My Profile</Text>
        <Text style={styles.muted}>View your doctor profile and account info.</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.muted}>- View patient list</Text>
        <Text style={styles.muted}>- Write prescriptions</Text>
        <Text style={styles.muted}>- Manage schedule</Text>
      </View>

      <Pressable
        disabled={busy}
        onPress={handleLogout}
        style={[styles.logout, busy ? styles.disabled : null]}>
        <Text style={styles.logoutText}>{busy ? 'Logging out...' : 'Logout'}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, gap: 16 },
  header: { marginTop: 20, marginBottom: 8 },
  kicker: { color: '#006b5a', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 6 },
  subtitle: { color: '#64748b', marginTop: 4 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  muted: { color: '#64748b', marginTop: 4 },
  logout: { marginTop: 10, backgroundColor: '#b91c1c', padding: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
