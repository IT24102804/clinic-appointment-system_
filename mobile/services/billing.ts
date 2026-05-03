import { createCrudService } from "@/services/crud-service";
import { CrudRecord } from "@/types/crud";

export type Billing = CrudRecord;
export type BillingPayload = Record<string, unknown>;

export const billingService = createCrudService<Billing, BillingPayload>("/api/billing");
