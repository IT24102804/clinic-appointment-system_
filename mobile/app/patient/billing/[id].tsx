import { PatientDetailScreen } from "@/components/patient/patient-detail-screen";
import { getMyBill } from "@/services/patient-portal";
import { formatDate, formatRef, formatValue } from "@/utils/format-record";

export default function PatientBillDetailScreen() {
  return (
    <PatientDetailScreen
      eyebrow="Bill details"
      title="Billing"
      subtitle="Read-only bill amount and payment status."
      load={getMyBill}
      backLabel="Back to bills"
      attachmentUrlKey="receiptUrl"
      attachmentNameKey="receiptName"
      getRows={(record) => [
        { label: "Appointment", value: formatRef(record.appointmentId) },
        { label: "Amount", value: `Rs. ${formatValue(record.amount)}` },
        { label: "Bill date", value: formatDate(record.billDate) },
        { label: "Payment method", value: formatValue(record.paymentMethod) },
        { label: "Payment status", value: formatValue(record.paymentStatus) },
        { label: "Notes", value: formatValue(record.notes) },
      ]}
    />
  );
}
