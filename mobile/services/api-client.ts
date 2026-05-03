import { toApiUrl } from "@/constants/api";
import { ApiEnvelope, UploadAsset } from "@/types/crud";

let authToken: string | null = null;
let refreshToken: string | null = null;
let refreshSessionHandler: ((accessToken: string, nextRefreshToken: string) => Promise<void>) | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setRefreshToken(token: string | null) {
  refreshToken = token;
}

export function setRefreshSessionHandler(handler: ((accessToken: string, nextRefreshToken: string) => Promise<void>) | null) {
  refreshSessionHandler = handler;
}

export function getAuthToken() {
  return authToken;
}

async function refreshAccessToken() {
  if (!refreshToken) {
    return null;
  }

  if (!refreshPromise) {
    refreshPromise = fetch(toApiUrl("/api/auth/refresh"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as ApiEnvelope<{ accessToken: string; refreshToken: string; token: string }> | null;

        if (!response.ok || !payload?.data) {
          setAuthToken(null);
          setRefreshToken(null);
          return null;
        }

        const nextAccessToken = payload.data.accessToken || payload.data.token;
        const nextRefreshToken = payload.data.refreshToken;
        setAuthToken(nextAccessToken);
        setRefreshToken(nextRefreshToken);
        await refreshSessionHandler?.(nextAccessToken, nextRefreshToken);
        return nextAccessToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

export async function request<T>(path: string, init?: RequestInit, retryOnUnauthorized = true): Promise<T> {
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
    if (response.status === 401 && retryOnUnauthorized) {
      const refreshedToken = await refreshAccessToken();

      if (refreshedToken) {
        return request<T>(path, init, false);
      }
    }

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
