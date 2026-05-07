import { request } from "@/services/api-client";
import { createCrudService } from "@/services/crud-service";
import { CrudRecord } from "@/types/crud";

export type Patient = CrudRecord;
export type PatientPayload = Record<string, unknown>;

export const patientService = {
  ...createCrudService<Patient, PatientPayload>("/api/patients"),
  list(filters?: { search?: string; gender?: string; status?: string }) {
    const searchParams = new URLSearchParams();

    if (filters?.search) {
      searchParams.set("search", filters.search);
    }

    if (filters?.gender && filters.gender !== "all") {
      searchParams.set("gender", filters.gender);
    }

    if (filters?.status && filters.status !== "all") {
      searchParams.set("status", filters.status);
    }

    const queryString = searchParams.toString();
    return request<Patient[]>(queryString ? `/api/patients?${queryString}` : "/api/patients");
  },
};
