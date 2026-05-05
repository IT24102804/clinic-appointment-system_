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
const PRESCRIPTION_APPOINTMENT_STATUSES = new Set(["confirmed", "completed"]);

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

function getAppointmentStatus(appointment: CrudRecord) {
  return typeof appointment.status === "string" ? appointment.status : "";
}

function isPrescriptionAppointmentOption(appointment: CrudRecord, selectedAppointmentId?: string) {
  return appointment._id === selectedAppointmentId || PRESCRIPTION_APPOINTMENT_STATUSES.has(getAppointmentStatus(appointment));
}

function getAppointmentSchedule(appointment: CrudRecord) {
  return `${formatDate(appointment.appointmentDate)} ${appointment.timeSlot || ""}`.trim() || "No date/time set";
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
  const [showAppointmentOptions, setShowAppointmentOptions] = useState(() => !initialValue?.appointmentId);
  const [showIssuedDatePicker, setShowIssuedDatePicker] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setForm(cloneFormValue(initialValue));
    setShowAppointmentOptions(!initialValue?.appointmentId);
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
  const appointmentOptions = useMemo(
    () => appointments.filter((appointment) => isPrescriptionAppointmentOption(appointment, form.appointmentId)),
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
    setShowAppointmentOptions(false);
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
      {!loadingAppointments && showAppointmentOptions && appointments.length > 0 && appointmentOptions.length === 0 ? (
        <Text style={styles.helperText}>
          Confirm or complete an appointment first. Prescriptions can only be created for confirmed or completed visits.
        </Text>
      ) : null}
      {showAppointmentOptions ? (
        <View style={styles.referenceList}>
          {appointmentOptions.map((appointment) => {
            const selected = form.appointmentId === appointment._id;
            const status = getAppointmentStatus(appointment) || "unknown";

            return (
              <AppCard key={appointment._id} muted style={[styles.appointmentOption, selected && styles.selectedAppointmentOption]}>
                <View style={styles.appointmentHeader}>
                  <Text style={styles.appointmentTitle}>{formatRef(appointment.patientId)}</Text>
                  <Text style={styles.statusPill}>{status.toUpperCase()}</Text>
                </View>
                <Text style={styles.appointmentMeta}>Doctor: {formatRef(appointment.doctorId)}</Text>
                <Text style={styles.appointmentMeta}>Visit: {getAppointmentSchedule(appointment)}</Text>
                <Text style={styles.appointmentId}>Appointment ID: {appointment.referenceId || appointment._id}</Text>
                <AppButton
                  label={selected ? "Selected visit" : "Select this visit"}
                  onPress={() => selectAppointment(appointment)}
                  variant={selected ? "primary" : "secondary"}
                  style={styles.selectVisitButton}
                />
              </AppCard>
            );
          })}
        </View>
      ) : null}
      {form.appointmentId ? (
        <AppCard muted style={styles.selectedVisitCard}>
          <Text style={styles.selectedVisitTitle}>Selected visit summary</Text>
          <Text style={styles.selectedVisitText}>
            Appointment: {selectedAppointment?.referenceId || form.appointmentId}
          </Text>
          <Text style={styles.selectedVisitText}>
            Patient: {selectedAppointment ? formatRef(selectedAppointment.patientId) : form.patientId}
          </Text>
          <Text style={styles.selectedVisitId}>Patient ID: {form.patientId || "Not selected"}</Text>
          <Text style={styles.selectedVisitText}>
            Doctor: {selectedAppointment ? formatRef(selectedAppointment.doctorId) : form.doctorId}
          </Text>
          <Text style={styles.selectedVisitId}>Doctor ID: {form.doctorId || "Not selected"}</Text>
          <AppButton
            label="Change appointment"
            onPress={() => setShowAppointmentOptions(true)}
            variant="secondary"
            style={styles.changeVisitButton}
          />
        </AppCard>
      ) : (
        <Text style={styles.helperText}>Select one confirmed/completed appointment. Patient and doctor are linked automatically.</Text>
      )}

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
  appointmentOption: {
    gap: 10,
    padding: 14,
  },
  selectedAppointmentOption: {
    borderColor: AppColors.accent,
    borderWidth: 2,
  },
  appointmentHeader: {
    alignItems: "flex-start",
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
  },
  appointmentTitle: {
    color: AppColors.text,
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    lineHeight: 21,
  },
  appointmentMeta: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  appointmentId: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  statusPill: {
    backgroundColor: AppColors.accentSoft,
    borderRadius: 999,
    color: AppColors.accent,
    fontSize: 11,
    fontWeight: "900",
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  selectVisitButton: {
    paddingVertical: 11,
  },
  selectedVisitCard: {
    gap: 6,
    padding: 14,
  },
  selectedVisitTitle: {
    color: AppColors.text,
    fontSize: 15,
    fontWeight: "800",
  },
  selectedVisitText: {
    color: AppColors.textMuted,
    fontSize: 13,
    lineHeight: 19,
  },
  selectedVisitId: {
    color: AppColors.accent,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 17,
  },
  changeVisitButton: {
    marginTop: 4,
    paddingVertical: 11,
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
