import { PatientRecordList } from "@/components/patient/patient-record-list";
import { listMyMedicalRecords } from "@/services/patient-portal";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function PatientMedicalRecordsScreen() {
  return (
    <PatientRecordList
      eyebrow="My medical records"
      title="Medical records"
      subtitle="View official visit summaries, diagnoses, and treatment notes."
      emptyTitle="No medical records yet"
      emptyMessage="Medical records will appear here after clinic staff or doctors create them."
      load={listMyMedicalRecords}
      getTitle={(record) => formatValue(record.diagnosis)}
      getSubtitle={(record) =>
        `${formatValue(record.referenceId)} | ${formatRef(record.doctorId)} | ${formatDate(record.recordDate)} | ${formatValue(record.status)}`
      }
      getHref={(record) => ({ pathname: "/patient/medical-records/[id]", params: { id: record._id } })}
    />
  );
}
