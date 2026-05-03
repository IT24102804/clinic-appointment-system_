import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppColors } from "@/constants/design";
import { appointmentService } from "@/services/appointments";
import { getAuthToken } from "@/services/api-client";
import { CrudRecord } from "@/types/crud";
import { MedicineItem, PrescriptionPayload, PrescriptionStatus } from "@/types/prescription";
import { formatDate, formatRef, getRefId } from "@/utils/format-record";

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

function toDateValue(value?: string) {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function toDatePayload(value: Date) {
  return value.toISOString();
}

export function PrescriptionForm({
  initialValue,
  submitLabel,
  busy = false,
  error,
  onSubmit,
}: PrescriptionFormProps) {
  const [form, setForm] = useState<PrescriptionPayload>(() => cloneFormValue(initialValue));
  const [appointments, setAppointments] = useState<CrudRecord[]>([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [showIssuedDatePicker, setShowIssuedDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setForm(cloneFormValue(initialValue));
  }, [initialValue]);

  useEffect(() => {
    if (!getAuthToken()) {
      return;
    }

    async function loadAppointments() {
      try {
        setLoadingAppointments(true);
        const data = await appointmentService.list();
        setAppointments(data);
        setAppointmentError(null);
      } catch (loadError) {
        setAppointmentError(loadError instanceof Error ? loadError.message : "Unable to load appointments.");
      } finally {
        setLoadingAppointments(false);
      }
    }

    void loadAppointments();
  }, []);

  const canShowIssuedAt = useMemo(() => form.status === "issued", [form.status]);
  const selectedAppointment = useMemo(
    () => appointments.find((appointment) => appointment._id === form.appointmentId),
    [appointments, form.appointmentId]
  );

  function updateField<Key extends keyof PrescriptionPayload>(key: Key, value: PrescriptionPayload[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function selectAppointment(appointment: CrudRecord) {
    setForm((current) => ({
      ...current,
      appointmentId: appointment._id,
      patientId: getRefId(appointment.patientId),
      doctorId: getRefId(appointment.doctorId),
    }));
  }

  function handleIssuedDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowIssuedDatePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    updateField("issuedAt", toDatePayload(selectedDate));
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
      {loadingAppointments ? <Text style={styles.helperText}>Loading appointments...</Text> : null}
      {appointmentError ? <Text style={styles.errorText}>{appointmentError}</Text> : null}
      {!loadingAppointments && appointments.length === 0 ? (
        <Text style={styles.helperText}>Create an appointment first. Prescriptions are linked to an appointment, patient, and doctor.</Text>
      ) : null}
      <View style={styles.referenceList}>
        {appointments.map((appointment) => {
          const selected = form.appointmentId === appointment._id;
          const label = `${formatDate(appointment.appointmentDate)} ${appointment.timeSlot || ""}`.trim();

          return (
            <AppButton
              key={appointment._id}
              label={label || appointment._id}
              onPress={() => selectAppointment(appointment)}
              variant={selected ? "primary" : "secondary"}
            />
          );
        })}
      </View>
      <AppInput placeholder="Appointment ID" value={form.appointmentId || "Select appointment"} editable={false} autoCapitalize="none" />
      <AppInput
        placeholder="Patient"
        value={form.patientId ? (selectedAppointment ? formatRef(selectedAppointment.patientId) : form.patientId) : "Select appointment"}
        editable={false}
      />
      <Text style={styles.helperText}>Patient ID: {form.patientId || "Not selected"}</Text>
      <AppInput
        placeholder="Doctor"
        value={form.doctorId ? (selectedAppointment ? formatRef(selectedAppointment.doctorId) : form.doctorId) : "Select appointment"}
        editable={false}
      />
      <Text style={styles.helperText}>Doctor ID: {form.doctorId || "Not selected"}</Text>

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
        <View style={styles.dateGroup}>
          <Text style={styles.helperText}>{form.issuedAt ? formatDate(form.issuedAt) : "No issued date selected"}</Text>
          <AppButton label="Pick issued date" variant="secondary" onPress={() => setShowIssuedDatePicker(true)} />
          {showIssuedDatePicker ? (
            <DateTimePicker
              value={toDateValue(form.issuedAt)}
              mode="date"
              display="default"
              onChange={handleIssuedDateChange}
            />
          ) : null}
        </View>
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
  referenceList: {
    gap: 8,
  },
  helperText: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  dateGroup: {
    gap: 8,
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
