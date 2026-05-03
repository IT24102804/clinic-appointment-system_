import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { getMyPrescription } from "@/services/patient-portal";
import { CrudRecord } from "@/types/crud";
import { formatDate, formatDateTime, formatRef, formatValue } from "@/utils/format-record";

type Medicine = {
  name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  instructions?: string;
};

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function PatientPrescriptionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [prescription, setPrescription] = useState<CrudRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPrescription = useCallback(async () => {
    if (!id) {
      setError("Prescription ID is missing.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await getMyPrescription(id);
      setPrescription(data);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load prescription.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void loadPrescription();
    }, [loadPrescription])
  );

  const medicines = Array.isArray(prescription?.medicines) ? (prescription?.medicines as Medicine[]) : [];
  const attachmentUrl = typeof prescription?.attachmentUrl === "string" ? prescription.attachmentUrl : "";

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader
          eyebrow="Prescription details"
          title={formatValue(prescription?.referenceId || "Prescription")}
          subtitle="Medicine instructions assigned by your doctor."
        />

        {loading ? (
          <StatePanel loading message="Loading prescription..." />
        ) : error ? (
          <StatePanel title="Unable to load prescription" message={error} variant="error" actionLabel="Try again" onAction={() => void loadPrescription()} />
        ) : prescription ? (
          <>
            <AppCard style={styles.card}>
              <DetailRow label="Diagnosis" value={formatValue(prescription.diagnosis)} />
              <DetailRow label="Doctor" value={formatRef(prescription.doctorId)} />
              <DetailRow label="Appointment" value={formatRef(prescription.appointmentId)} />
              <DetailRow label="Status" value={formatValue(prescription.status)} />
              <DetailRow label="Issued date" value={formatDate(prescription.issuedAt) || "Not issued yet"} />
              <DetailRow label="Created" value={formatDateTime(prescription.createdAt)} />
              <DetailRow label="Notes" value={formatValue(prescription.notes)} />
            </AppCard>

            <Text style={styles.sectionTitle}>Medicines</Text>
            {medicines.length === 0 ? (
              <StatePanel title="No medicines listed" message="This prescription has no medicine entries." variant="empty" />
            ) : (
              medicines.map((medicine, index) => (
                <AppCard key={`${medicine.name || "medicine"}-${index}`} style={styles.card}>
                  <Text style={styles.medicineTitle}>{index + 1}. {formatValue(medicine.name)}</Text>
                  <DetailRow label="Dosage" value={formatValue(medicine.dosage)} />
                  <DetailRow label="Frequency" value={formatValue(medicine.frequency)} />
                  <DetailRow label="Duration" value={formatValue(medicine.duration)} />
                  <DetailRow label="Instructions" value={formatValue(medicine.instructions)} />
                </AppCard>
              ))
            )}

            {attachmentUrl ? (
              <AppButton label="Open attachment" variant="secondary" onPress={() => void Linking.openURL(attachmentUrl)} />
            ) : null}
          </>
        ) : (
          <StatePanel title="Prescription not found" message="This prescription may have been removed." variant="empty" />
        )}

        <AppButton label="Back to prescriptions" variant="secondary" onPress={() => router.back()} />
      </AppScreen>
    </PatientAuthGate>
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
  sectionTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "900",
  },
  medicineTitle: {
    color: AppColors.text,
    fontSize: 17,
    fontWeight: "900",
  },
});
