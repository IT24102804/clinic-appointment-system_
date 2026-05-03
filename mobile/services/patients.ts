import { createCrudService } from "@/services/crud-service";
import { CrudRecord } from "@/types/crud";

export type Patient = CrudRecord;
export type PatientPayload = Record<string, unknown>;

export const patientService = createCrudService<Patient, PatientPayload>("/api/patients");
