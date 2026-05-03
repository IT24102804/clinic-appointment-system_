import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { listMyAppointments } from "@/services/patient-portal";
import { CrudRecord } from "@/types/crud";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function PatientHomeScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const [appointments, setAppointments] = useState<CrudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listMyAppointments();
      setAppointments(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load appointments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadAppointments();
    }, [loadAppointments])
  );

  const upcomingAppointment = appointments.find((appointment) => appointment.status !== "cancelled" && appointment.status !== "rejected");

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader
          tone="hero"
          eyebrow="Patient portal"
          title={`Hello, ${user?.name || "Patient"}`}
          subtitle="Book appointments, track status, and view your clinic records."
        />

        <AppButton label="Book appointment" onPress={() => router.push("/patient/book")} />

        {loading ? (
          <StatePanel loading message="Loading your appointment status..." />
        ) : error ? (
          <StatePanel title="Unable to load status" message={error} variant="error" actionLabel="Try again" onAction={() => void loadAppointments()} />
        ) : upcomingAppointment ? (
          <AppCard style={styles.card}>
            <Text style={styles.eyebrow}>Upcoming appointment</Text>
            <Text style={styles.title}>{formatRef(upcomingAppointment.doctorId)}</Text>
            <Text style={styles.meta}>
              {formatDate(upcomingAppointment.appointmentDate)} | {formatValue(upcomingAppointment.timeSlot)}
            </Text>
            <Text style={styles.meta}>Status: {formatValue(upcomingAppointment.status)}</Text>
          </AppCard>
        ) : (
          <StatePanel title="No appointments yet" message="Book your first appointment by selecting a doctor and available time slot." variant="empty" />
        )}

        <View style={styles.grid}>
          <QuickCard title="My appointments" text="View pending and confirmed bookings." onPress={() => router.push("/patient/appointments")} />
          <QuickCard title="Prescriptions" text="View medicines assigned by doctors." onPress={() => router.push("/patient/prescriptions")} />
          <QuickCard title="Medical records" text="Open visit history and reports." onPress={() => router.push("/patient/medical-records")} />
          <QuickCard title="Billing" text="Check bills and payment status." onPress={() => router.push("/patient/billing")} />
          <QuickCard title="My documents" text="Upload supporting medical documents." onPress={() => router.push("/patient/documents")} />
          <QuickCard title="Profile" text="View and update your profile." onPress={() => router.push("/patient/profile")} />
        </View>

        <AppButton label="More / logout" variant="secondary" onPress={() => router.push("/patient/more")} />
      </AppScreen>
    </PatientAuthGate>
  );
}

function QuickCard({ title, text, onPress }: { title: string; text: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.quickLink}>
      <AppCard style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{text}</Text>
      </AppCard>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  grid: {
    gap: 12,
  },
  quickLink: {
    width: "100%",
  },
  card: {
    gap: 8,
    padding: 16,
  },
  eyebrow: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  title: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  meta: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
