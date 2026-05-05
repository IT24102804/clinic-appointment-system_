import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { PageHeader } from "@/components/ui/page-header";
import { AppScreen } from "@/components/ui/app-screen";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { getAuthToken } from "@/services/api-client";
import { appointmentService } from "@/services/appointments";
import { billingService } from "@/services/billing";
import { doctorService } from "@/services/doctors";
import { patientService } from "@/services/patients";
import { CrudRecord } from "@/types/crud";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

type DashboardData = {
  appointments: CrudRecord[];
  patients: CrudRecord[];
  doctors: CrudRecord[];
  bills: CrudRecord[];
};

const EMPTY_DASHBOARD: DashboardData = {
  appointments: [],
  patients: [],
  doctors: [],
  bills: [],
};

function isToday(value: unknown) {
  if (!value || typeof value !== "string") {
    return false;
  }

  const date = new Date(value);
  const today = new Date();

  return (
    !Number.isNaN(date.getTime()) &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { logout } = useAuthSession();
  const [dashboard, setDashboard] = useState<DashboardData>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const todayAppointments = dashboard.appointments.filter((item) => isToday(item.appointmentDate)).length;
    const availableDoctors = dashboard.doctors.filter((item) => item.availabilityStatus !== "unavailable").length;
    const pendingBills = dashboard.bills.filter((item) => item.paymentStatus === "pending").length;

    return {
      todayAppointments,
      activePatients: dashboard.patients.filter((item) => item.status !== "inactive").length,
      availableDoctors,
      pendingBills,
    };
  }, [dashboard]);

  const upcomingAppointments = useMemo(
    () =>
      [...dashboard.appointments]
        .filter((item) => item.status !== "cancelled")
        .sort((left, right) => String(left.appointmentDate).localeCompare(String(right.appointmentDate)))
        .slice(0, 3),
    [dashboard.appointments]
  );

  const loadHomeData = useCallback(async () => {
    if (!getAuthToken()) {
      setLoading(false);
      setError("Login with a staff account to load today's clinic dashboard.");
      return;
    }

    try {
      setLoading(true);
      const [appointments, patients, doctors, bills] = await Promise.all([
        appointmentService.list(),
        patientService.list(),
        doctorService.list(),
        billingService.list(),
      ]);
      setDashboard({ appointments, patients, doctors, bills });
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

  async function switchAccount() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <AppScreen scroll contentContainerStyle={styles.screen}>
      <PageHeader
        tone="hero"
        eyebrow="Clinic operations"
        title="Clinic dashboard"
        subtitle="See today's visits, open patient records, and continue clinic work from one mobile workspace."
      />

      <View style={styles.actionRow}>
        <AppButton label="Book appointment" onPress={() => router.push("/appointments/new")} />
        <AppButton label="Add patient" onPress={() => router.push("/patients/new")} variant="secondary" />
        <AppButton label="Switch account" onPress={() => void switchAccount()} variant="secondary" />
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Today overview</Text>
        <Text style={styles.sectionSubtitle}>Key clinic numbers for appointments, patients, doctors, and billing.</Text>
      </View>

      {loading ? (
        <StatePanel loading message="Loading today's clinic activity..." />
      ) : error ? (
        <StatePanel
          title="Login required"
          message={error}
          variant={getAuthToken() ? "error" : "empty"}
          actionLabel={getAuthToken() ? "Retry dashboard" : "Go to login"}
          onAction={() => (getAuthToken() ? void loadHomeData() : router.push("/auth/login"))}
        />
      ) : (
        <View style={styles.snapshotStack}>
          <AppCard style={styles.highlightCard}>
            <Text style={styles.highlightEyebrow}>Live today</Text>
            <Text style={styles.highlightTitle}>{summary.todayAppointments} appointments today</Text>
            <Text style={styles.highlightText}>Use the appointment list to check the next visit, update status, or continue to prescriptions and billing.</Text>
          </AppCard>

          <View style={styles.metricsGrid}>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.todayAppointments}</Text>
              <Text style={styles.metricLabel}>Visits today</Text>
            </AppCard>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.activePatients}</Text>
              <Text style={styles.metricLabel}>Active patients</Text>
            </AppCard>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.availableDoctors}</Text>
              <Text style={styles.metricLabel}>Available doctors</Text>
            </AppCard>
            <AppCard style={styles.metricCard}>
              <Text style={styles.metricValue}>{summary.pendingBills}</Text>
              <Text style={styles.metricLabel}>Pending bills</Text>
            </AppCard>
          </View>
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <Text style={styles.sectionSubtitle}>Common clinic tasks should be one tap away.</Text>
      </View>

      <View style={styles.quickGrid}>
        <Pressable onPress={() => router.push("/(tabs)/appointments")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Schedule</Text>
            <Text style={styles.quickTitle}>Appointments</Text>
            <Text style={styles.quickText}>Book, reschedule, complete, or cancel visits.</Text>
          </AppCard>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/prescriptions")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Treatment</Text>
            <Text style={styles.quickTitle}>Prescriptions</Text>
            <Text style={styles.quickText}>Issue medicines from a completed or active appointment.</Text>
          </AppCard>
        </Pressable>

        <Pressable onPress={() => router.push("/(tabs)/more")} style={styles.quickLink}>
          <AppCard style={styles.quickCard}>
            <Text style={styles.quickEyebrow}>Records</Text>
            <Text style={styles.quickTitle}>Patients, doctors, billing</Text>
            <Text style={styles.quickText}>Open supporting clinic modules from the More tab.</Text>
          </AppCard>
        </Pressable>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Upcoming appointments</Text>
        <Text style={styles.sectionSubtitle}>Next scheduled visits from the live appointment collection.</Text>
      </View>

      {upcomingAppointments.length > 0 ? (
        <View style={styles.appointmentList}>
          {upcomingAppointments.map((appointment) => (
            <Pressable
              key={appointment._id}
              onPress={() => router.push({ pathname: "/appointments/[id]" as any, params: { id: appointment._id } })}>
              <AppCard style={styles.appointmentCard}>
                <Text style={styles.quickEyebrow}>{formatDate(appointment.appointmentDate)}</Text>
                <Text style={styles.quickTitle}>{formatRef(appointment.patientId)}</Text>
                <Text style={styles.quickText}>
                  {formatRef(appointment.doctorId)} | {formatValue(appointment.timeSlot)}
                </Text>
              </AppCard>
            </Pressable>
          ))}
        </View>
      ) : (
        <StatePanel title="No appointments yet" message="Create a patient and doctor first, then book the first appointment." variant="empty" />
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
  appointmentList: {
    gap: 12,
  },
  appointmentCard: {
    padding: 18,
    gap: 8,
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
