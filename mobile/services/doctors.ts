import { createCrudService } from "@/services/crud-service";
import { CrudRecord } from "@/types/crud";

export type Doctor = CrudRecord;
export type DoctorPayload = Record<string, unknown>;

export const doctorService = createCrudService<Doctor, DoctorPayload>("/api/doctors");
