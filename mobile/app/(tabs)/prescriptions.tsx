import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { listPrescriptions } from "@/services/prescriptions";
import { Prescription } from "@/types/prescription";

type CounterState = {
  total: number;
  draft: number;
  issued: number;
  cancelled: number;
};

function formatDate(value?: string) {
  if (!value) {
    return "No issue date yet";
  }

  return new Date(value).toLocaleString();
}

function statusTone(status?: string) {
  if (status === "issued") {
    return styles.statusIssued;
  }

  if (status === "cancelled") {
    return styles.statusCancelled;
  }

  return styles.statusDraft;
}

export default function PrescriptionsScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const counters = useMemo(() => {
    return prescriptions.reduce<CounterState>(
      (accumulator, prescription) => {
        accumulator.total += 1;
        accumulator[prescription.status || "draft"] += 1;
        return accumulator;
      },
      { total: 0, draft: 0, issued: 0, cancelled: 0 }
    );
  }, [prescriptions]);

  const loadPrescriptions = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await listPrescriptions();
      setPrescriptions(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load prescriptions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPrescriptions();
    }, [loadPrescriptions])
  );

  return (
    <AppScreen style={styles.screen}>
      <PageHeader
        eyebrow="Prescription management"
        title="Staff prescription queue"
        subtitle="Review prescriptions, open a record, or create a new one after a consultation."
      />

      <View style={styles.metricsRow}>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{counters.total}</Text>
          <Text style={styles.metricLabel}>Total</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{counters.issued}</Text>
          <Text style={styles.metricLabel}>Issued</Text>
        </AppCard>
        <AppCard style={styles.metricCard}>
          <Text style={styles.metricValue}>{counters.draft}</Text>
          <Text style={styles.metricLabel}>Draft</Text>
        </AppCard>
      </View>

      <AppButton label="Create prescription" onPress={() => router.push("/prescriptions/new")} />

      {loading ? (
        <View style={styles.stateWrapper}>
          <StatePanel loading message="Loading prescriptions from the live API..." />
        </View>
      ) : error ? (
        <View style={styles.stateWrapper}>
          <StatePanel title="Unable to load prescriptions" message={error} variant="error" actionLabel="Try again" onAction={() => void loadPrescriptions()} />
        </View>
      ) : prescriptions.length === 0 ? (
        <View style={styles.stateWrapper}>
          <StatePanel title="No prescriptions yet" message="Create the first prescription record so the team can test the full CRUD flow." variant="empty" />
        </View>
      ) : (
        <FlatList
          data={prescriptions}
          keyExtractor={(item) => item._id}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void loadPrescriptions(true)} />}
          renderItem={({ item }) => (
            <AppCard style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={[styles.statusPill, statusTone(item.status)]}>
                  <Text style={styles.statusText}>{(item.status || "draft").toUpperCase()}</Text>
                </View>
                <Text style={styles.cardDate}>{formatDate(item.issuedAt || item.createdAt)}</Text>
              </View>

              <Text style={styles.cardTitle}>{item.diagnosis}</Text>
              <Text style={styles.cardMeta}>Appointment: {item.appointmentId}</Text>
              <Text style={styles.cardMeta}>Patient: {item.patientId}</Text>
              <Text style={styles.cardMeta}>Doctor: {item.doctorId}</Text>
              <Text style={styles.cardMeta}>Medicines: {item.medicines.length}</Text>
              {item.attachmentName ? <Text style={styles.attachmentText}>Attachment: {item.attachmentName}</Text> : null}

              <AppButton
                label="Open details"
                onPress={() =>
                  router.push({
                    pathname: "/prescriptions/[id]",
                    params: { id: item._id },
                  })
                }
                variant="secondary"
                style={styles.openButton}
              />
            </AppCard>
          )}
        />
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  metricsRow: {
    flexDirection: "row",
    gap: 12,
  },
  metricCard: {
    flex: 1,
    padding: 16,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.text,
  },
  metricLabel: {
    marginTop: 4,
    fontSize: 13,
    color: AppColors.textMuted,
  },
  stateWrapper: {
    flex: 1,
    justifyContent: "center",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 28,
    gap: 14,
  },
  card: {
    padding: 16,
    gap: 8,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  statusDraft: {
    backgroundColor: AppColors.draftSoft,
  },
  statusIssued: {
    backgroundColor: AppColors.successSoft,
  },
  statusCancelled: {
    backgroundColor: AppColors.warningSoft,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "800",
    color: AppColors.text,
  },
  cardDate: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.text,
  },
  cardMeta: {
    fontSize: 14,
    color: AppColors.textMuted,
  },
  attachmentText: {
    fontSize: 14,
    color: AppColors.accent,
    fontWeight: "700",
  },
  openButton: {
    marginTop: 6,
  },
});
