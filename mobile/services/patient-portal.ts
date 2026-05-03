import { appendAttachment, request } from "@/services/api-client";
import { CrudRecord, UploadAsset } from "@/types/crud";

export type PatientProfile = CrudRecord & {
  fullName: string;
  age: number;
  gender: "male" | "female" | "other";
  phone: string;
  nic?: string;
  dateOfBirth?: string;
  email?: string;
  address?: string;
  additionalAddresses?: { label: string; address: string }[];
  emergencyContact?: { name?: string; phone?: string; relationship?: string };
};

export type PatientDocument = CrudRecord & {
  title: string;
  description?: string;
  documentType: string;
  fileUrl: string;
  fileName: string;
  status: string;
  reviewNotes?: string;
};

export function getMyProfile() {
  return request<PatientProfile>("/api/patients/me");
}

export function updateMyProfile(payload: Partial<PatientProfile>) {
  return request<PatientProfile>("/api/patients/me", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function listPatientDoctors() {
  return request<CrudRecord[]>("/api/patient/doctors");
}

export function listDoctorSlots(doctorId: string, date: string) {
  return request<string[]>(`/api/patient/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}`);
}

export function createPatientAppointment(payload: {
  doctorId: string;
  appointmentDate: string;
  timeSlot: string;
  reason: string;
}) {
  return request<CrudRecord>("/api/patient/appointments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listMyAppointments() {
  return request<CrudRecord[]>("/api/patient/appointments");
}

export function getMyAppointment(id: string) {
  return request<CrudRecord>(`/api/patient/appointments/${id}`);
}

export function listMyPrescriptions() {
  return request<CrudRecord[]>("/api/patient/prescriptions");
}

export function getMyPrescription(id: string) {
  return request<CrudRecord>(`/api/patient/prescriptions/${id}`);
}

export function listMyBills() {
  return request<CrudRecord[]>("/api/patient/billing");
}

export function getMyBill(id: string) {
  return request<CrudRecord>(`/api/patient/billing/${id}`);
}

export function listMyMedicalRecords() {
  return request<CrudRecord[]>("/api/patient/medical-records");
}

export function getMyMedicalRecord(id: string) {
  return request<CrudRecord>(`/api/patient/medical-records/${id}`);
}

export function listMyDocuments() {
  return request<PatientDocument[]>("/api/patient/documents");
}

export function uploadMyDocument(payload: {
  title: string;
  description?: string;
  documentType: string;
  asset: UploadAsset;
}) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("description", payload.description || "");
  formData.append("documentType", payload.documentType);
  appendAttachment(formData, payload.asset);

  return request<PatientDocument>("/api/patient/documents", {
    method: "POST",
    body: formData,
  });
}

export function deleteMyDocument(id: string) {
  return request<{ id: string }>(`/api/patient/documents/${id}`, {
    method: "DELETE",
  });
}
