import { PatientRecordList } from "@/components/patient/patient-record-list";
import { listMyAppointments } from "@/services/patient-portal";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function PatientAppointmentsScreen() {
  return (
    <PatientRecordList
      eyebrow="My appointments"
      title="Appointment status"
      subtitle="Track pending, confirmed, rejected, completed, and cancelled appointment requests."
      emptyTitle="No appointments yet"
      emptyMessage="Book an appointment to see its status here."
      load={listMyAppointments}
      getTitle={(record) => formatRef(record.doctorId)}
      getSubtitle={(record) =>
        `${formatValue(record.referenceId)} | ${formatDate(record.appointmentDate)} ${formatValue(record.timeSlot)} | ${formatValue(record.status)}`
      }
      getHref={(record) => ({ pathname: "/patient/appointments/[id]", params: { id: record._id } })}
    />
  );
}
