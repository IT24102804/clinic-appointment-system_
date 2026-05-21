import { request } from "@/services/api-client";
import { CrudRecord } from "@/types/crud";

export type StaffPatientDocument = CrudRecord & {
  title: string;
  description?: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  status: string;
  reviewNotes?: string;
  reviewedBy?: {
    _id: string;
    referenceId?: string;
    name?: string;
    role?: string;
  } | null;
};

export function listPatientDocuments() {
  return request<StaffPatientDocument[]>("/api/patient-documents");
}

export function reviewPatientDocument(id: string, payload: { status: string; reviewNotes?: string }) {
  return request<StaffPatientDocument>(`/api/patient-documents/${id}/review`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}
