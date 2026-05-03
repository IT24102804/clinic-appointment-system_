import { RefValue } from "@/types/crud";

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

export type Prescription = Omit<PrescriptionPayload, "appointmentId" | "patientId" | "doctorId"> & {
  _id: string;
  referenceId?: string;
  appointmentId: RefValue;
  patientId: RefValue;
  doctorId: RefValue;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentPublicId?: string;
  attachmentResourceType?: string;
  createdAt: string;
  updatedAt: string;
};
