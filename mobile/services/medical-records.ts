import { createCrudService } from "@/services/crud-service";
import { CrudRecord } from "@/types/crud";

export type MedicalRecord = CrudRecord;
export type MedicalRecordPayload = Record<string, unknown>;

export const medicalRecordService = createCrudService<MedicalRecord, MedicalRecordPayload>("/api/medical-records");
