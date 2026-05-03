import { appendAttachment, request } from "@/services/api-client";
import { UploadAsset } from "@/types/crud";
import { Prescription, PrescriptionPayload, PrescriptionStatus } from "@/types/prescription";

type PrescriptionFilters = {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: PrescriptionStatus;
};

export async function listPrescriptions(filters?: PrescriptionFilters) {
  const searchParams = new URLSearchParams();

  if (filters?.patientId) {
    searchParams.set("patientId", filters.patientId);
  }

  if (filters?.doctorId) {
    searchParams.set("doctorId", filters.doctorId);
  }

  if (filters?.appointmentId) {
    searchParams.set("appointmentId", filters.appointmentId);
  }

  if (filters?.status) {
    searchParams.set("status", filters.status);
  }

  const query = searchParams.toString();
  return request<Prescription[]>(`/api/prescriptions${query ? `?${query}` : ""}`);
}

export async function getPrescription(id: string) {
  return request<Prescription>(`/api/prescriptions/${id}`);
}

export async function createPrescription(payload: PrescriptionPayload) {
  return request<Prescription>("/api/prescriptions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updatePrescription(id: string, payload: PrescriptionPayload) {
  return request<Prescription>(`/api/prescriptions/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deletePrescription(id: string) {
  return request<{ id: string }>(`/api/prescriptions/${id}`, {
    method: "DELETE",
  });
}

export async function uploadPrescriptionAttachment(id: string, asset: UploadAsset) {
  const formData = new FormData();
  appendAttachment(formData, asset);

  return request<Prescription>(`/api/prescriptions/${id}/attachment`, {
    method: "POST",
    body: formData,
  });
}

export async function deletePrescriptionAttachment(id: string) {
  return request<Prescription>(`/api/prescriptions/${id}/attachment`, {
    method: "DELETE",
  });
}
