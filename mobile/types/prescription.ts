export type PrescriptionStatus = "draft" | "issued" | "cancelled";

export type MedicineItem = {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
};

export type PrescriptionPayload = {
  appointmentId: string;
  patientId: string;
  doctorId: string;
  diagnosis: string;
  medicines: MedicineItem[];
  notes?: string;
  status?: PrescriptionStatus;
  issuedAt?: string;
};

export type Prescription = PrescriptionPayload & {
  _id: string;
  attachmentUrl?: string;
  attachmentName?: string;
  createdAt: string;
  updatedAt: string;
};
