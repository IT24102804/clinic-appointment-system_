import { PatientDetailScreen } from "@/components/patient/patient-detail-screen";
import { getMyMedicalRecord } from "@/services/patient-portal";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function PatientMedicalRecordDetailScreen() {
  return (
    <PatientDetailScreen
      eyebrow="Medical record details"
      title="Medical record"
      subtitle="Official clinic notes from your visit."
      load={getMyMedicalRecord}
      backLabel="Back to medical records"
      getRows={(record) => [
        { label: "Doctor", value: formatRef(record.doctorId) },
        { label: "Appointment", value: formatRef(record.appointmentId) },
        { label: "Visit summary", value: formatValue(record.visitSummary) },
        { label: "Diagnosis", value: formatValue(record.diagnosis) },
        { label: "Treatment notes", value: formatValue(record.treatmentNotes) },
        { label: "Record date", value: formatDate(record.recordDate) },
        { label: "Status", value: formatValue(record.status) },
      ]}
    />
  );
}
