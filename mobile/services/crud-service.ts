import { appendAttachment, request } from "@/services/api-client";
import { CrudRecord, UploadAsset } from "@/types/crud";

export function createCrudService<TRecord extends CrudRecord, TPayload extends Record<string, unknown>>(basePath: string) {
  return {
    list() {
      return request<TRecord[]>(basePath);
    },
    get(id: string) {
      return request<TRecord>(`${basePath}/${id}`);
    },
    create(payload: TPayload) {
      return request<TRecord>(basePath, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    update(id: string, payload: Partial<TPayload>) {
      return request<TRecord>(`${basePath}/${id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    },
    remove(id: string) {
      return request<{ id: string }>(`${basePath}/${id}`, {
        method: "DELETE",
      });
    },
    uploadAttachment(id: string, asset: UploadAsset) {
      const formData = new FormData();
      appendAttachment(formData, asset);

      return request<TRecord>(`${basePath}/${id}/attachment`, {
        method: "POST",
        body: formData,
      });
    },
    deleteAttachment(id: string) {
      return request<TRecord>(`${basePath}/${id}/attachment`, {
        method: "DELETE",
      });
    },
  };
}
