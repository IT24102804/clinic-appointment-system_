import { PatientRecordList } from "@/components/patient/patient-record-list";
import { listMyBills } from "@/services/patient-portal";
import { formatDate, formatValue } from "@/utils/format-record";

export default function PatientBillingScreen() {
  return (
    <PatientRecordList
      eyebrow="My billing"
      title="Bills"
      subtitle="View bill amounts, dates, and payment status."
      emptyTitle="No bills yet"
      emptyMessage="Bills will appear here after clinic staff create them."
      load={listMyBills}
      getTitle={(record) => `Rs. ${formatValue(record.amount)}`}
      getSubtitle={(record) =>
        `${formatValue(record.referenceId)} | ${formatDate(record.billDate)} | ${formatValue(record.paymentMethod)} | ${formatValue(record.paymentStatus)}`
      }
      getHref={(record) => ({ pathname: "/patient/billing/[id]", params: { id: record._id } })}
    />
  );
}
