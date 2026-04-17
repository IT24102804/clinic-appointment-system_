import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { listPrescriptions } from "@/services/prescriptions";
import { Prescription } from "@/types/prescription";

export default function HomeScreen() {
  const router = useRouter();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const issued = prescriptions.filter((item) => item.status === "issued").length;
    const drafts = prescriptions.filter((item) => item.status === "draft").length;
    const withAttachments = prescriptions.filter((item) => item.attachmentUrl).length;

    return {
      total: prescriptions.length,
      issued,
      drafts,
      withAttachments,
    };
  }, [prescriptions]);

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listPrescriptions();
      setPrescriptions(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load the dashboard.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadHomeData();
    }, [loadHomeData])
  );

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        tone="hero"
        eyebrow="Daily workspace"
        title="Clinic dashboard"
        subtitle="Move from check-in to follow-up with one calm mobile flow for appointments, prescriptions, and supporting records."
      />

      <View style={styles.actionRow}>
        <AppButton label="Create prescription" onPress={() => router.push("/prescriptions/new")} />
        <AppButton label="Browse modules" onPress={() => router.push("/(tabs)/more")} variant="secondary" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Start a task</Text>
        <Text style={styles.sectionSubtitle}>
          Use the same simple flow staff-friendly apps use: begin with the visit, handle treatment, then open supporting modules only when needed.
        </Text>
      </View>

      <View style={styles.quickGrid}>
        <Pressable onPress={() => router.push("/(tabs)/appointments")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Visit flow</Text>
            <Text style={styles.quickTitle}>Appointments</Text>
            <Text style={styles.quickText}>Review bookings, reschedule visits, and keep the day moving on time.</Text>
          </AppCard>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/prescriptions")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Clinical work</Text>
            <Text style={styles.quickTitle}>Prescriptions</Text>
            <Text style={styles.quickText}>Create treatment instructions, manage medicines, and attach PDFs or images.</Text>
          </AppCard>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/more")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Support tools</Text>
            <Text style={styles.quickTitle}>Patients, billing & records</Text>
            <Text style={styles.quickText}>Jump into people, billing, doctor, and record modules from one shared workspace.</Text>
          </AppCard>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Prescription snapshot</Text>
        <Text style={styles.sectionSubtitle}>
          This live section keeps the dashboard practical. It shows what is waiting, what is complete, and how much documentation is attached right now.
        </Text>
      </View>

      {loading ? (
        <StatePanel loading message="Loading the latest prescription activity..." />
      ) : error ? (
        <StatePanel
          title="Dashboard unavailable"
          message={error}
          variant="error"
          actionLabel="Retry dashboard"
          onAction={() => void loadHomeData()}
        />
      ) : (
        <View style={styles.snapshotStack}>
          <AppCard style={styles.highlightCard}>
            <Text style={styles.highlightEyebrow}>Live now</Text>
            <Text style={styles.highlightTitle}>{summary.drafts} drafts need review</Text>
            <Text style={styles.highlightText}>
              Open the prescription queue to finish drafts, issue medication instructions, and keep the treatment flow clear.
            </Text>
          </AppCard>

          <View style={styles.metricsGrid}>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.total}</Text>
              <Text style={styles.metricLabel}>Total prescriptions</Text>
            </AppCard>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.issued}</Text>
              <Text style={styles.metricLabel}>Issued records</Text>
            </AppCard>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.drafts}</Text>
              <Text style={styles.metricLabel}>Draft records</Text>
            </AppCard>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.withAttachments}</Text>
              <Text style={styles.metricLabel}>With attachments</Text>
            </AppCard>
          </View>
        </View>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 18,
  },
  actionRow: {
    gap: 12,
  },
  sectionHeader: {
    gap: 6,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.text,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textMuted,
  },
  snapshotStack: {
    gap: 12,
  },
  highlightCard: {
    padding: 18,
    gap: 8,
    backgroundColor: AppColors.accentSoft,
    borderColor: "#c5e2eb",
  },
  highlightEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: AppColors.accent,
  },
  highlightTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: AppColors.text,
  },
  highlightText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
  quickGrid: {
    gap: 12,
  },
  quickLink: {
    width: "100%",
  },
  quickCard: {
    padding: 18,
    gap: 8,
  },
  quickEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    color: AppColors.accent,
  },
  quickTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: AppColors.text,
  },
  quickText: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textMuted,
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metricCard: {
    width: "47%",
    padding: 18,
    gap: 6,
  },
  metricValue: {
    fontSize: 26,
    fontWeight: "800",
    color: AppColors.text,
  },
  metricLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: AppColors.textMuted,
  },
});
