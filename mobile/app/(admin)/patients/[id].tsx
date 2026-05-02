import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { getPatient, type AdminPatientDetail } from '../../../services/adminPatients';

export default function AdminPatientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [patient, setPatient] = useState<AdminPatientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const data = await getPatient(String(id));
        if (active) setPatient(data);
      } catch (e: any) {
        if (active) setError(e?.response?.data?.message || e?.message || 'Failed to load patient');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  const fullName = `${patient?.userId?.firstName ?? ''} ${patient?.userId?.lastName ?? ''}`.trim() || 'Unnamed';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      {loading ? (
        <View style={styles.center}><ActivityIndicator /></View>
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : !patient ? (
        <Text style={styles.muted}>Patient not found.</Text>
      ) : (
        <>
          <Text style={styles.kicker}>Patient profile</Text>
          <Text style={styles.title}>{fullName}</Text>
          <Text style={styles.subtitle}>{patient.userId?.email}</Text>

          <View style={styles.card}>
            <Field label="NIC" value={patient.NIC} />
            <Field label="Phone" value={patient.phone} />
            <Field label="Gender" value={patient.gender} />
            <Field
              label="Date of Birth"
              value={patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}
            />
            <Field label="Status" value={patient.userId?.status} />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Address</Text>
            <Text style={styles.value}>{patient.address || '-'}</Text>

            {patient.additionalAddresses && patient.additionalAddresses.length > 0 ? (
              <>
                <Text style={[styles.cardTitle, { marginTop: 12 }]}>Additional Addresses</Text>
                {patient.additionalAddresses.map((a, i) => (
                  <Text key={a._id || `addr-${i}`} style={styles.value}>
                    [{a.label || 'other'}] {a.line}
                  </Text>
                ))}
              </>
            ) : null}
          </View>

          {patient.emergencyContact ? (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Emergency Contact</Text>
              <Field label="Name" value={patient.emergencyContact.name} />
              <Field label="Phone" value={patient.emergencyContact.phone} />
              <Field label="Relationship" value={patient.emergencyContact.relationship} />
            </View>
          ) : null}
        </>
      )}
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
  content: { padding: 20, paddingTop: 50, gap: 14 },
  backBtn: { marginBottom: 6 },
  backText: { color: '#1d4ed8', fontWeight: '700' },
  kicker: { color: '#1d4ed8', fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase', fontSize: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b' },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  value: { color: '#0f172a', marginTop: 4 },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6 },
  fieldLabel: { color: '#64748b', fontSize: 13, fontWeight: '700' },
  fieldValue: { color: '#0f172a', fontWeight: '600' },
  center: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  error: { color: '#b91c1c' },
  muted: { color: '#64748b' },
});
