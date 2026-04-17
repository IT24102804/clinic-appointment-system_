import { toApiUrl } from "@/constants/api";
import { Prescription, PrescriptionPayload, PrescriptionStatus } from "@/types/prescription";

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
};

type PrescriptionFilters = {
  patientId?: string;
  doctorId?: string;
  appointmentId?: string;
  status?: PrescriptionStatus;
};

type UploadAsset = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

function inferMimeType(fileName: string) {
  if (fileName.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (fileName.endsWith(".png")) {
    return "image/png";
  }

  if (fileName.endsWith(".webp")) {
    return "image/webp";
  }

  return "image/jpeg";
}

async function request<T>(path: string, init?: RequestInit) {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(toApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    throw new Error(payload?.message || "Request failed.");
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload.data;
}

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

  formData.append(
    "attachment",
    {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || inferMimeType(asset.name.toLowerCase()),
    } as any
  );

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
