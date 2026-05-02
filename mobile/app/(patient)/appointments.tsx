import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { listAppointments } from "@/services/appointments";
import { Appointment, AppointmentStatus, DoctorRef } from "@/types/appointment";

type TabKey = "upcoming" | "past";
const UPCOMING: AppointmentStatus[] = ["pending", "confirmed"];

function getDoctorName(doc: string | DoctorRef): string {
  if (typeof doc === "object" && doc !== null && "name" in doc) return doc.name;
  return "";
}

function formatDate(v?: string) {
  if (!v) return "Not scheduled";
  return new Date(v).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatTime(v?: string) {
  if (!v) return "";
  return new Date(v).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function statusStyle(s?: string) {
  if (s === "confirmed") return { bg: "#e8f5e9", color: "#2e7d32" };
  if (s === "completed") return { bg: "#e0f2f1", color: "#00695c" };
  if (s === "cancelled" || s === "no-show" || s === "rejected") {
    return { bg: "#fce4ec", color: "#c62828" };
  }
  return { bg: "#fff8e1", color: "#f57f17" };
}

export default function PatientAppointmentsScreen() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>("upcoming");
  const [search, setSearch] = useState("");

  const { upcoming, past } = useMemo(() => {
    const up: Appointment[] = [];
    const pa: Appointment[] = [];
    for (const a of appointments) {
      (UPCOMING.includes(a.status) ? up : pa).push(a);
    }
    up.sort(
      (a, b) =>
        new Date(a.appointmentDate).getTime() -
        new Date(b.appointmentDate).getTime()
    );
    pa.sort(
      (a, b) =>
        new Date(b.appointmentDate).getTime() -
        new Date(a.appointmentDate).getTime()
    );
    return { upcoming: up, past: pa };
  }, [appointments]);

  const displayList = activeTab === "upcoming" ? upcoming : past;
  const filtered = useMemo(() => {
    if (!search.trim()) return displayList;
    const q = search.trim().toLowerCase();
    return displayList.filter(
      (a) =>
        a.reason.toLowerCase().includes(q) ||
        getDoctorName(a.doctorId).toLowerCase().includes(q)
    );
  }, [displayList, search]);

  const load = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);
      // Backend automatically scopes to logged-in patient via middleware.
      setAppointments(await listAppointments());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={stylesVars.teal} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Appointments</Text>
          <Text style={styles.subtitle}>Your upcoming and past visits</Text>
        </View>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => router.push("/(patient)/appointments-new" as any)}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryBtnText}>Book</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabsRow}>
        {(["upcoming", "past"] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabChipText,
                activeTab === tab && styles.tabChipTextActive,
              ]}
            >
              {tab === "upcoming"
                ? `Upcoming (${upcoming.length})`
                : `Past (${past.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by reason or doctor"
          placeholderTextColor="#94a3b8"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load(true)}
            tintColor={stylesVars.teal}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No appointments</Text>
            <Text style={styles.emptyText}>
              Book your first appointment using the Book button.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const ss = statusStyle(item.status);
          const doctorName = getDoctorName(item.doctorId);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() =>
                router.push(`/(patient)/appointment/${item._id}` as any)
              }
            >
              <View style={styles.cardTopRow}>
                <Text style={styles.cardTitle}>{item.reason}</Text>
                <View style={[styles.statusPill, { backgroundColor: ss.bg }]}>
                  <Text style={[styles.statusText, { color: ss.color }]}>
                    {String(item.status).toUpperCase()}
                  </Text>
                </View>
              </View>

              <Text style={styles.cardLine}>Doctor: {doctorName || "—"}</Text>
              <Text style={styles.cardLine}>
                {formatDate(item.appointmentDate)} • {formatTime(item.appointmentDate)}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const stylesVars = {
  teal: "#1BAF95",
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "900", color: "#0f172a" },
  subtitle: { color: "#64748b", marginTop: 2 },
  primaryBtn: {
    backgroundColor: stylesVars.teal,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  primaryBtnText: { color: "#fff", fontWeight: "900" },
  tabsRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  tabChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  tabChipActive: { backgroundColor: "#E1F5EE", borderColor: "#bfe9dc" },
  tabChipText: { color: "#475569", fontWeight: "800", fontSize: 12 },
  tabChipTextActive: { color: "#0F6E56" },
  searchRow: { paddingHorizontal: 20, paddingBottom: 10 },
  searchInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#fff",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#0f172a",
  },
  list: { padding: 20, gap: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 16,
    padding: 14,
    backgroundColor: "#fff",
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a", flex: 1 },
  statusPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  statusText: { fontWeight: "900", fontSize: 11 },
  cardLine: { color: "#475569", marginTop: 6, fontWeight: "700" },
  empty: { padding: 22, alignItems: "center" },
  emptyTitle: { fontWeight: "900", color: "#0f172a", fontSize: 16 },
  emptyText: { color: "#64748b", marginTop: 6, textAlign: "center" },
});
