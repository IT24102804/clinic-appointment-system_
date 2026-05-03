import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DoctorAuthGate } from "@/components/doctor/doctor-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { AppColors } from "@/constants/design";
import { createDoctorPrescription } from "@/services/doctor-portal";

export default function DoctorCreatePrescriptionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [diagnosis, setDiagnosis] = useState("");
  const [medicineName, setMedicineName] = useState("");
  const [dosage, setDosage] = useState("");
  const [frequency, setFrequency] = useState("");
  const [duration, setDuration] = useState("");
  const [instructions, setInstructions] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!id || !diagnosis.trim() || !medicineName.trim() || !dosage.trim() || !frequency.trim() || !duration.trim()) {
      setError("Diagnosis, medicine name, dosage, frequency, and duration are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createDoctorPrescription(id, {
        diagnosis: diagnosis.trim(),
        notes: notes.trim(),
        medicines: [
          {
            name: medicineName.trim(),
            dosage: dosage.trim(),
            frequency: frequency.trim(),
            duration: duration.trim(),
            instructions: instructions.trim(),
          },
        ],
      });
      router.replace("/doctor/home");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to create prescription.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DoctorAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow="Create prescription" title="Prescription" subtitle="This prescription will be issued to the appointment patient." />

        <AppCard style={styles.card}>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Diagnosis *</Text>
            <AppInput value={diagnosis} onChangeText={setDiagnosis} placeholder="Diagnosis" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Medicine name *</Text>
            <AppInput value={medicineName} onChangeText={setMedicineName} placeholder="Medicine name" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Dosage *</Text>
            <AppInput value={dosage} onChangeText={setDosage} placeholder="5mg" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Frequency *</Text>
            <AppInput value={frequency} onChangeText={setFrequency} placeholder="Once daily" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Duration *</Text>
            <AppInput value={duration} onChangeText={setDuration} placeholder="7 days" />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Instructions</Text>
            <AppInput value={instructions} onChangeText={setInstructions} placeholder="Take after breakfast" multiline />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Notes</Text>
            <AppInput value={notes} onChangeText={setNotes} placeholder="Additional prescription notes" multiline />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <AppButton label="Issue prescription" onPress={() => void submit()} busy={saving} />
          <AppButton label="Cancel" variant="secondary" onPress={() => router.back()} />
        </AppCard>
      </AppScreen>
    </DoctorAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  card: {
    gap: 14,
    padding: 16,
  },
  fieldGroup: {
    gap: 8,
  },
  label: {
    color: AppColors.text,
    fontSize: 14,
    fontWeight: "800",
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
});
