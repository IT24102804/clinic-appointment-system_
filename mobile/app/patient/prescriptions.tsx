import { PatientRecordList } from "@/components/patient/patient-record-list";
import { listMyPrescriptions } from "@/services/patient-portal";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function PatientPrescriptionsScreen() {
  return (
    <PatientRecordList
      eyebrow="My prescriptions"
      title="Prescriptions"
      subtitle="View medicines and instructions assigned by your doctor."
      emptyTitle="No prescriptions yet"
      emptyMessage="Prescriptions will appear here after a doctor creates them."
      load={listMyPrescriptions}
      getTitle={(record) => formatValue(record.diagnosis)}
      getSubtitle={(record) =>
        `${formatValue(record.referenceId)} | ${formatRef(record.doctorId)} | ${formatDate(record.issuedAt || record.createdAt)} | ${formatValue(record.status)}`
      }
      getHref={(record) => ({ pathname: "/patient/prescriptions/[id]", params: { id: record._id } })}
    />
  );
}
