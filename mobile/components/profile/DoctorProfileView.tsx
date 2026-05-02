import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function DoctorProfileView() {
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
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {`${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'D'}
        </Text>
      </View>

      <Text style={styles.kicker}>Doctor Profile</Text>
      <Text style={styles.title}>Dr. {user?.firstName} {user?.lastName}</Text>
      <Text style={styles.subtitle}>{user?.email}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account</Text>
        <Field label="Role" value="Doctor" />
        <Field label="Email" value={user?.email} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Coming Soon</Text>
        <Text style={styles.muted}>- Specialization, license number</Text>
        <Text style={styles.muted}>- Available time slots</Text>
        <Text style={styles.muted}>- Consultation fees</Text>
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

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldValue}>{value || '-'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  content: { padding: 20, paddingTop: 50, gap: 14, alignItems: 'stretch' },
  avatar: { alignSelf: 'center', width: 90, height: 90, borderRadius: 45, backgroundColor: '#006b5a', alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  avatarText: { color: '#fff', fontWeight: '900', fontSize: 28 },
  kicker: { color: '#006b5a', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12, textAlign: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  subtitle: { color: '#64748b', textAlign: 'center', marginBottom: 8 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  muted: { color: '#64748b', marginTop: 4 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  fieldLabel: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  fieldValue: { color: '#0f172a', fontWeight: '600' },
  logout: { marginTop: 10, backgroundColor: '#b91c1c', padding: 14, borderRadius: 12, alignItems: 'center' },
  logoutText: { color: '#fff', fontWeight: '800' },
  disabled: { opacity: 0.7 },
});
