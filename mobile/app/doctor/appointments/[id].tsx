import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DoctorAuthGate } from "@/components/doctor/doctor-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { getDoctorAppointment } from "@/services/doctor-portal";
import { CrudRecord } from "@/types/crud";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function DoctorAppointmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [appointment, setAppointment] = useState<CrudRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointment = useCallback(async () => {
    if (!id) {
      setError("Appointment ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getDoctorAppointment(id);
      setAppointment(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load appointment.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadAppointment();
    }, [loadAppointment])
  );

  return (
    <DoctorAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow="Assigned appointment" title="Appointment details" subtitle="Review the patient visit and create a prescription." />

        {loading ? (
          <StatePanel loading message="Loading appointment..." />
        ) : error ? (
          <StatePanel title="Unable to load appointment" message={error} variant="error" actionLabel="Try again" onAction={() => void loadAppointment()} />
        ) : appointment ? (
          <>
            <AppCard style={styles.card}>
              <DetailRow label="Reference ID" value={formatValue(appointment.referenceId)} />
              <DetailRow label="Patient" value={formatRef(appointment.patientId)} />
              <DetailRow label="Date" value={formatDate(appointment.appointmentDate)} />
              <DetailRow label="Time slot" value={formatValue(appointment.timeSlot)} />
              <DetailRow label="Reason" value={formatValue(appointment.reason)} />
              <DetailRow label="Status" value={formatValue(appointment.status)} />
            </AppCard>

            <AppButton
              label="Create prescription"
              onPress={() => router.push({ pathname: "/doctor/appointments/[id]/prescription", params: { id: appointment._id } })}
            />
          </>
        ) : (
          <StatePanel title="Appointment not found" message="This appointment may no longer be assigned to you." variant="empty" />
        )}

        <AppButton label="Back to dashboard" variant="secondary" onPress={() => router.back()} />
      </AppScreen>
    </DoctorAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 14,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  row: {
    gap: 4,
  },
  label: {
    color: AppColors.textMuted,
    fontSize: 13,
    fontWeight: "700",
  },
  value: {
    color: AppColors.text,
    fontSize: 15,
    lineHeight: 21,
  },
});
