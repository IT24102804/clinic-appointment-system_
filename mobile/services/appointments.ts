import { createCrudService } from "@/services/crud-service";
import { CrudRecord } from "@/types/crud";

export type Appointment = CrudRecord;
export type AppointmentPayload = Record<string, unknown>;

export const appointmentService = createCrudService<Appointment, AppointmentPayload>("/api/appointments");
