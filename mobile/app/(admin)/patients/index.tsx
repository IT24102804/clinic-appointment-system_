import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { listPatients, type AdminPatientListItem } from '../../../services/adminPatients';

export default function AdminPatientsListScreen() {
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<AdminPatientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebounced(search.trim()), 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const load = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await listPatients({ search: debounced || undefined });
      setItems(data);
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to load patients');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  const headerCount = useMemo(() => items.length, [items]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Patients</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Loading...' : `${headerCount} result${headerCount === 1 ? '' : 's'}`}
        </Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search by NIC, phone, or name"
        placeholderTextColor="#94a3b8"
        value={search}
        onChangeText={setSearch}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.error}>{error}</Text>
          <Pressable onPress={() => void load()} style={styles.retry}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.muted}>No patients found.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} />}
          renderItem={({ item }) => {
            const fullName = `${item.user?.firstName ?? ''} ${item.user?.lastName ?? ''}`.trim() || 'Unnamed';
            return (
              <Pressable
                onPress={() => router.push({ pathname: '/(admin)/patients/[id]', params: { id: item._id } } as any)}
                style={styles.card}>
                <View style={styles.cardRow}>
                  <Text style={styles.cardName}>{fullName}</Text>
                  {item.user?.status ? (
                    <View
                      style={[
                        styles.statusPill,
                        item.user.status === 'active' ? styles.statusActive : styles.statusInactive,
                      ]}>
                      <Text style={styles.statusText}>{item.user.status.toUpperCase()}</Text>
                    </View>
                  ) : null}
                </View>
                <Text style={styles.cardMeta}>NIC: {item.NIC}</Text>
                <Text style={styles.cardMeta}>Phone: {item.phone}</Text>
                {item.user?.email ? <Text style={styles.cardMeta}>{item.user.email}</Text> : null}
              </Pressable>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', paddingTop: 50 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  backBtn: { marginBottom: 8 },
  backText: { color: '#1d4ed8', fontWeight: '700' },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  subtitle: { color: '#64748b', marginTop: 4 },
  search: {
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#fff',
    fontSize: 15,
    color: '#0f172a',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  error: { color: '#b91c1c', textAlign: 'center' },
  retry: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#1d4ed8', borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '800' },
  muted: { color: '#64748b' },
  listContent: { paddingHorizontal: 20, paddingBottom: 28, gap: 12 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardName: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  cardMeta: { color: '#475569', marginTop: 2, fontSize: 13 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusActive: { backgroundColor: '#dcfce7' },
  statusInactive: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 11, fontWeight: '800', color: '#0f172a' },
});
