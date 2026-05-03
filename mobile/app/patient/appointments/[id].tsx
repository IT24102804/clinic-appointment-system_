import { PatientDetailScreen } from "@/components/patient/patient-detail-screen";
import { getMyAppointment } from "@/services/patient-portal";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function PatientAppointmentDetailScreen() {
  return (
    <PatientDetailScreen
      eyebrow="Appointment details"
      title="Appointment"
      subtitle="Read-only status and visit information."
      load={getMyAppointment}
      backLabel="Back to appointments"
      getRows={(record) => [
        { label: "Doctor", value: formatRef(record.doctorId) },
        { label: "Date", value: formatDate(record.appointmentDate) },
        { label: "Time slot", value: formatValue(record.timeSlot) },
        { label: "Reason", value: formatValue(record.reason) },
        { label: "Status", value: formatValue(record.status) },
      ]}
    />
  );
}
