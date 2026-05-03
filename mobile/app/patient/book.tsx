import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { PatientAuthGate } from "@/components/patient/patient-auth-gate";
import { AppButton } from "@/components/ui/app-button";
import { AppCard } from "@/components/ui/app-card";
import { AppInput } from "@/components/ui/app-input";
import { AppScreen } from "@/components/ui/app-screen";
import { PageHeader } from "@/components/ui/page-header";
import { StatePanel } from "@/components/ui/state-panel";
import { AppColors } from "@/constants/design";
import { createPatientAppointment, listDoctorSlots, listPatientDoctors } from "@/services/patient-portal";
import { CrudRecord } from "@/types/crud";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

function toDatePayload(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatAvailability(doctor: CrudRecord) {
  if (!Array.isArray(doctor.availability) || doctor.availability.length === 0) {
    return "Availability not set";
  }

  return doctor.availability
    .map((item: any) => `${item.dayOfWeek} ${item.startTime}-${item.endTime}`)
    .join(", ");
}

export default function PatientBookAppointmentScreen() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<CrudRecord[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState("");
  const [doctorSearch, setDoctorSearch] = useState("");
  const [appointmentDate, setAppointmentDate] = useState("");
  const [slots, setSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [reason, setReason] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadDoctors() {
      try {
        setLoadingDoctors(true);
        const data = await listPatientDoctors();
        setDoctors(data);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load doctors.");
      } finally {
        setLoadingDoctors(false);
      }
    }

    void loadDoctors();
  }, []);

  useEffect(() => {
    async function loadSlots() {
      if (!selectedDoctorId || !appointmentDate) {
        setSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        const data = await listDoctorSlots(selectedDoctorId, appointmentDate);
        setSlots(data);
        setSelectedSlot("");
        setError(null);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load slots.");
      } finally {
        setLoadingSlots(false);
      }
    }

    void loadSlots();
  }, [appointmentDate, selectedDoctorId]);

  function handleDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowDatePicker(false);

    if (event.type === "dismissed" || !selectedDate) {
      return;
    }

    setAppointmentDate(toDatePayload(selectedDate));
  }

  async function submit() {
    if (!selectedDoctorId || !appointmentDate || !selectedSlot || !reason.trim()) {
      setError("Doctor, date, time slot, and reason are required.");
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await createPatientAppointment({
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot: selectedSlot,
        reason: reason.trim(),
      });
      router.replace("/patient/appointments");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to book appointment.");
    } finally {
      setSaving(false);
    }
  }

  const filteredDoctors = doctors.filter((doctor) => {
    const search = doctorSearch.trim().toLowerCase();

    if (!search) {
      return true;
    }

    return `${doctor.fullName || ""} ${doctor.specialization || ""}`.toLowerCase().includes(search);
  });

  return (
    <PatientAuthGate>
      <AppScreen scroll contentContainerStyle={styles.screen}>
        <PageHeader eyebrow="Book appointment" title="Find a doctor" subtitle="Select a doctor, date, available slot, and reason for visit." />

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>1. Select doctor</Text>
          <AppInput
            value={doctorSearch}
            onChangeText={setDoctorSearch}
            placeholder="Search by doctor name or specialization"
            autoCapitalize="none"
          />
          {loadingDoctors ? <StatePanel loading message="Loading doctors..." /> : null}
          {!loadingDoctors && filteredDoctors.length === 0 ? (
            <Text style={styles.helperText}>No doctors match your search.</Text>
          ) : null}
          {filteredDoctors.map((doctor) => (
            <Pressable
              key={doctor._id}
              onPress={() => setSelectedDoctorId(doctor._id)}
            >
              <AppCard muted={selectedDoctorId !== doctor._id} style={[styles.doctorCard, selectedDoctorId === doctor._id && styles.selectedDoctorCard]}>
                <Text style={styles.doctorName}>{formatRef(doctor)}</Text>
                <Text style={styles.helperText}>{formatValue(doctor.specialization)} | Rs. {formatValue(doctor.sessionFee)}</Text>
                <Text style={styles.helperText}>{formatAvailability(doctor)}</Text>
              </AppCard>
            </Pressable>
          ))}
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>2. Select date</Text>
          <Text style={styles.helperText}>{appointmentDate ? formatDate(appointmentDate) : "No date selected"}</Text>
          <AppButton label="Pick appointment date" variant="secondary" onPress={() => setShowDatePicker(true)} />
          {showDatePicker ? <DateTimePicker value={appointmentDate ? new Date(appointmentDate) : new Date()} mode="date" display="default" onChange={handleDateChange} /> : null}
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>3. Select available slot</Text>
          {loadingSlots ? <StatePanel loading message="Loading available slots..." /> : null}
          {!loadingSlots && selectedDoctorId && appointmentDate && slots.length === 0 ? (
            <Text style={styles.helperText}>No slots are available for this doctor on the selected date.</Text>
          ) : null}
          <View style={styles.optionRow}>
            {slots.map((slot) => (
              <AppButton
                key={slot}
                label={slot}
                onPress={() => setSelectedSlot(slot)}
                variant={selectedSlot === slot ? "primary" : "secondary"}
                style={styles.optionButton}
              />
            ))}
          </View>
        </AppCard>

        <AppCard style={styles.card}>
          <Text style={styles.sectionTitle}>4. Reason for visit</Text>
          <AppInput value={reason} onChangeText={setReason} placeholder="Describe the reason for your visit" multiline />
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <AppButton label="Submit appointment request" onPress={() => void submit()} busy={saving} />
        </AppCard>
      </AppScreen>
    </PatientAuthGate>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16,
  },
  card: {
    gap: 12,
    padding: 16,
  },
  sectionTitle: {
    color: AppColors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  helperText: {
    color: AppColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  optionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    minWidth: 110,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  doctorCard: {
    gap: 6,
    padding: 14,
  },
  selectedDoctorCard: {
    borderColor: AppColors.accent,
    borderWidth: 2,
  },
  doctorName: {
    color: AppColors.text,
    fontSize: 16,
    fontWeight: "900",
  },
  errorText: {
    color: AppColors.danger,
    fontSize: 14,
  },
});
