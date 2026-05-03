import { request } from "@/services/api-client";
import { CrudRecord } from "@/types/crud";

export type DoctorPrescriptionPayload = {
  diagnosis: string;
  notes?: string;
  medicines: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }[];
};

export function listDoctorAppointments() {
  return request<CrudRecord[]>("/api/doctor/appointments");
}

export function getDoctorAppointment(id: string) {
  return request<CrudRecord>(`/api/doctor/appointments/${id}`);
}

export function createDoctorPrescription(appointmentId: string, payload: DoctorPrescriptionPayload) {
  return request<CrudRecord>(`/api/doctor/appointments/${appointmentId}/prescriptions`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
