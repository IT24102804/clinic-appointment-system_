import { request, setAuthToken, setRefreshToken } from "@/services/api-client";

export type UserRole = "admin" | "doctor" | "receptionist" | "patient";
export type UserStatus = "active" | "inactive";

export type User = {
  _id: string;
  referenceId?: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type AuthPayload = {
  name?: string;
  email: string;
  password: string;
  role?: UserRole;
};

export type PatientRegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  gender: "male" | "female" | "other";
  phone: string;
  nic: string;
  dateOfBirth: string;
  address: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
};

type AuthResponse = {
  user: User;
  token: string;
  accessToken?: string;
  refreshToken: string;
};

export async function login(payload: Pick<AuthPayload, "email" | "password">) {
  const session = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(session.accessToken || session.token);
  setRefreshToken(session.refreshToken);
  return session;
}

export async function register(payload: Required<AuthPayload>) {
  const session = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(session.accessToken || session.token);
  setRefreshToken(session.refreshToken);
  return session;
}

export async function registerPatient(payload: PatientRegisterPayload) {
  const session = await request<AuthResponse>("/api/auth/register-patient", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  setAuthToken(session.accessToken || session.token);
  setRefreshToken(session.refreshToken);
  return session;
}

export async function logout(refreshToken?: string | null) {
  if (refreshToken) {
    await request<null>("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }).catch(() => null);
  }

  setAuthToken(null);
  setRefreshToken(null);
}

export function listUsers() {
  return request<User[]>("/api/users");
}

export function getUser(id: string) {
  return request<User>(`/api/users/${id}`);
}

export function createUser(payload: Required<AuthPayload> & { status?: UserStatus }) {
  return request<User>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: string, payload: Partial<Required<AuthPayload> & { status: UserStatus }>) {
  return request<User>(`/api/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function resetUserPassword(id: string, password: string) {
  return request<User>(`/api/users/${id}/password`, {
    method: "PUT",
    body: JSON.stringify({ password }),
  });
}

export function deactivateUser(id: string) {
  return request<User>(`/api/users/${id}`, {
    method: "DELETE",
  });
}
