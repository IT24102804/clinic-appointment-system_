import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppColors } from "@/constants/design";
import { MedicineItem, PrescriptionPayload, PrescriptionStatus } from "@/types/prescription";

type PrescriptionFormProps = {
  initialValue?: PrescriptionPayload;
  submitLabel: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (payload: PrescriptionPayload) => Promise<void> | void;
};

const STATUS_OPTIONS: PrescriptionStatus[] = ["draft", "issued", "cancelled"];

const EMPTY_MEDICINE: MedicineItem = {
  name: "",
  dosage: "",
  frequency: "",
  duration: "",
  instructions: "",
};

const EMPTY_FORM: PrescriptionPayload = {
  appointmentId: "",
  patientId: "",
  doctorId: "",
  diagnosis: "",
  medicines: [{ ...EMPTY_MEDICINE }],
  notes: "",
  status: "draft",
  issuedAt: "",
};

function cloneFormValue(value?: PrescriptionPayload): PrescriptionPayload {
  if (!value) {
    return EMPTY_FORM;
  }

  return {
    appointmentId: value.appointmentId || "",
    patientId: value.patientId || "",
    doctorId: value.doctorId || "",
    diagnosis: value.diagnosis || "",
    medicines:
      value.medicines?.length > 0
        ? value.medicines.map((medicine) => ({
            ...EMPTY_MEDICINE,
            ...medicine,
          }))
        : [{ ...EMPTY_MEDICINE }],
    notes: value.notes || "",
    status: value.status || "draft",
    issuedAt: value.issuedAt || "",
  };
}

export function PrescriptionForm({
  initialValue,
  submitLabel,
  busy = false,
  error,
  onSubmit,
}: PrescriptionFormProps) {
  const [form, setForm] = useState<PrescriptionPayload>(() => cloneFormValue(initialValue));
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setForm(cloneFormValue(initialValue));
  }, [initialValue]);

  const canShowIssuedAt = useMemo(() => form.status === "issued", [form.status]);

  function updateField<Key extends keyof PrescriptionPayload>(key: Key, value: PrescriptionPayload[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function updateMedicine(index: number, key: keyof MedicineItem, value: string) {
    setForm((current) => ({
      ...current,
      medicines: current.medicines.map((medicine, medicineIndex) =>
        medicineIndex === index ? { ...medicine, [key]: value } : medicine
      ),
    }));
  }

  function addMedicine() {
    setForm((current) => ({
      ...current,
      medicines: [...current.medicines, { ...EMPTY_MEDICINE }],
    }));
  }

  function removeMedicine(index: number) {
    setForm((current) => ({
      ...current,
      medicines:
        current.medicines.length === 1
          ? [{ ...EMPTY_MEDICINE }]
          : current.medicines.filter((_, medicineIndex) => medicineIndex !== index),
    }));
  }

  async function handleSubmit() {
    const trimmedPayload: PrescriptionPayload = {
      ...form,
      appointmentId: form.appointmentId.trim(),
      patientId: form.patientId.trim(),
      doctorId: form.doctorId.trim(),
      diagnosis: form.diagnosis.trim(),
      notes: form.notes?.trim(),
      issuedAt: form.issuedAt?.trim() || undefined,
      medicines: form.medicines.map((medicine) => ({
        name: medicine.name.trim(),
        dosage: medicine.dosage.trim(),
        frequency: medicine.frequency.trim(),
        duration: medicine.duration.trim(),
        instructions: medicine.instructions?.trim() || "",
      })),
    };

    if (
      !trimmedPayload.appointmentId ||
      !trimmedPayload.patientId ||
      !trimmedPayload.doctorId ||
      !trimmedPayload.diagnosis
    ) {
      setFormError("Appointment, patient, doctor, and diagnosis are all required.");
      return;
    }

    const hasIncompleteMedicine = trimmedPayload.medicines.some(
      (medicine) => !medicine.name || !medicine.dosage || !medicine.frequency || !medicine.duration
    );

    if (hasIncompleteMedicine) {
      setFormError("Every medicine entry needs a name, dosage, frequency, and duration.");
      return;
    }

    if (trimmedPayload.status !== "issued" || !trimmedPayload.issuedAt) {
      delete trimmedPayload.issuedAt;
    }

    setFormError(null);
    await onSubmit(trimmedPayload);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionLabel}>Visit references</Text>
      <AppInput
        placeholder="Appointment ID"
        value={form.appointmentId}
        onChangeText={(value) => updateField("appointmentId", value)}
        autoCapitalize="none"
      />
      <AppInput
        placeholder="Patient ID"
        value={form.patientId}
        onChangeText={(value) => updateField("patientId", value)}
        autoCapitalize="none"
      />
      <AppInput
        placeholder="Doctor ID"
        value={form.doctorId}
        onChangeText={(value) => updateField("doctorId", value)}
        autoCapitalize="none"
      />

      <Text style={styles.sectionLabel}>Clinical details</Text>
      <AppInput placeholder="Diagnosis" value={form.diagnosis} onChangeText={(value) => updateField("diagnosis", value)} />
      <AppInput placeholder="Notes" value={form.notes} onChangeText={(value) => updateField("notes", value)} multiline />

      <Text style={styles.sectionLabel}>Status</Text>
      <View style={styles.statusRow}>
        {STATUS_OPTIONS.map((status) => {
          const selected = form.status === status;
          return (
            <AppButton
              key={status}
              label={status.toUpperCase()}
              onPress={() => updateField("status", status)}
              variant={selected ? "primary" : "secondary"}
              style={styles.statusButton}
            />
          );
        })}
      </View>

      {canShowIssuedAt ? (
        <AppInput
          placeholder="Issued at (optional ISO date)"
          value={form.issuedAt}
          onChangeText={(value) => updateField("issuedAt", value)}
          autoCapitalize="none"
        />
      ) : null}

      <View style={styles.medicinesHeader}>
        <Text style={styles.sectionLabel}>Medicines</Text>
        <AppButton label="Add medicine" onPress={addMedicine} variant="secondary" style={styles.addButton} />
      </View>

      {form.medicines.map((medicine, index) => (
        <AppCard key={`${medicine.name}-${index}`} muted style={styles.medicineCard}>
          <View style={styles.medicineCardHeader}>
            <Text style={styles.medicineCardTitle}>Medicine {index + 1}</Text>
            <AppButton label="Remove" onPress={() => removeMedicine(index)} variant="danger" style={styles.removeButton} />
          </View>

          <AppInput
            placeholder="Medicine name"
            value={medicine.name}
            onChangeText={(value) => updateMedicine(index, "name", value)}
          />
          <AppInput
            placeholder="Dosage"
            value={medicine.dosage}
            onChangeText={(value) => updateMedicine(index, "dosage", value)}
          />
          <AppInput
            placeholder="Frequency"
            value={medicine.frequency}
            onChangeText={(value) => updateMedicine(index, "frequency", value)}
          />
          <AppInput
            placeholder="Duration"
            value={medicine.duration}
            onChangeText={(value) => updateMedicine(index, "duration", value)}
          />
          <AppInput
            placeholder="Special instructions"
            value={medicine.instructions}
            onChangeText={(value) => updateMedicine(index, "instructions", value)}
            multiline
          />
        </AppCard>
      ))}

      {formError ? <Text style={styles.errorText}>{formError}</Text> : null}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <AppButton label={submitLabel} onPress={() => void handleSubmit()} busy={busy} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: "700",
    color: AppColors.text,
  },
  statusRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statusButton: {
    minWidth: 112,
    paddingVertical: 10,
  },
  medicinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  addButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  medicineCard: {
    padding: 14,
    gap: 10,
  },
  medicineCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  medicineCardTitle: {
    fontWeight: "700",
    color: AppColors.text,
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
    lineHeight: 20,
  },
  removeButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
});
