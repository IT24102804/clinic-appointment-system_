import { toApiUrl } from "@/constants/api";
import { ApiEnvelope, UploadAsset } from "@/types/crud";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export async function request<T>(path: string, init?: RequestInit) {
  const isFormData = init?.body instanceof FormData;
  const response = await fetch(toApiUrl(path), {
    ...init,
    headers: {
      Accept: "application/json",
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok) {
    const validationMessage = payload?.errors?.map((error) => error.message).join(" ");
    throw new Error(validationMessage || payload?.message || "Request failed.");
  }

  if (!payload) {
    throw new Error("The server returned an empty response.");
  }

  return payload.data;
}

export function appendAttachment(formData: FormData, asset: UploadAsset) {
  formData.append(
    "attachment",
    {
      uri: asset.uri,
      name: asset.name,
      type: asset.mimeType || "application/octet-stream",
    } as any
  );
}
