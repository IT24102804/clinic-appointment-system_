import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text } from "react-native";

import { DoctorAuthGate } from "@/components/doctor/doctor-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { useAuthSession } from "@/context/auth-context";
import { listDoctorAppointments } from "@/services/doctor-portal";
import { CrudRecord } from "@/types/crud";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function DoctorHomeScreen() {
  const router = useRouter();
  const { logout, user } = useAuthSession();
  const [appointments, setAppointments] = useState<CrudRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listDoctorAppointments();
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

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <DoctorAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow="Doctor dashboard" title={`Hello, ${user?.name || "Doctor"}`} subtitle="View assigned appointments and create prescriptions." />

        {loading ? (
          <StatePanel loading message="Loading appointments..." />
        ) : error ? (
          <StatePanel title="Unable to load appointments" message={error} variant="error" actionLabel="Try again" onAction={() => void loadAppointments()} />
        ) : appointments.length === 0 ? (
          <StatePanel title="No assigned appointments" message="Appointments will appear here when they are assigned to your doctor profile." variant="empty" />
        ) : (
          appointments.map((appointment) => (
            <Pressable
              key={appointment._id}
              onPress={() => router.push({ pathname: "/doctor/appointments/[id]", params: { id: appointment._id } })}
            >
              <AppCard style={styles.card}>
                <Text style={styles.title}>{formatRef(appointment.patientId)}</Text>
                <Text style={styles.meta}>
                  {formatValue(appointment.referenceId)} | {formatDate(appointment.appointmentDate)} | {formatValue(appointment.timeSlot)}
                </Text>
                <Text style={styles.meta}>Status: {formatValue(appointment.status)}</Text>
                <Text style={styles.link}>Open appointment</Text>
              </AppCard>
            </Pressable>
          ))
        )}

        <AppButton label="Logout" variant="danger" onPress={() => void handleLogout()} />
      </AppScreen>
    </DoctorAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  card: {
    gap: 8,
    padding: 16,
  },
  title: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  meta: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    color: AppColors.accent,
    fontSize: 14,
    fontWeight: "800",
  },
});
