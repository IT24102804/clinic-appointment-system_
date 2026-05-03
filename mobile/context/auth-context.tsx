import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

import { setAuthToken } from "@/services/api-client";
import {
  login as loginRequest,
  logout as clearRequestToken,
  register as registerStaffRequest,
  registerPatient as registerPatientRequest,
  AuthPayload,
  PatientRegisterPayload,
  User,
} from "@/services/auth";

const TOKEN_KEY = "clinic-app-token";
const USER_KEY = "clinic-app-user";

type AuthContextValue = {
  loading: boolean;
  token: string | null;
  user: User | null;
  login: (payload: Pick<AuthPayload, "email" | "password">) => Promise<User>;
  registerStaff: (payload: Required<AuthPayload>) => Promise<User>;
  registerPatient: (payload: PatientRegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function persistSession(token: string, user: User) {
  setAuthToken(token);
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token],
    [USER_KEY, JSON.stringify(user)],
  ]);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function restoreSession() {
      try {
        const [[, storedToken], [, storedUser]] = await AsyncStorage.multiGet([TOKEN_KEY, USER_KEY]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setAuthToken(storedToken);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } finally {
        setLoading(false);
      }
    }

    void restoreSession();
  }, []);

  async function login(payload: Pick<AuthPayload, "email" | "password">) {
    const session = await loginRequest(payload);
    await persistSession(session.token, session.user);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }

  async function registerStaff(payload: Required<AuthPayload>) {
    const session = await registerStaffRequest(payload);
    await persistSession(session.token, session.user);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }

  async function registerPatient(payload: PatientRegisterPayload) {
    const session = await registerPatientRequest(payload);
    await persistSession(session.token, session.user);
    setToken(session.token);
    setUser(session.user);
    return session.user;
  }

  async function logout() {
    clearRequestToken();
    setToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  }

  return (
    <AuthContext.Provider value={{ loading, token, user, login, logout, registerPatient, registerStaff }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthSession() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuthSession must be used inside AuthProvider.");
  }

  return context;
}
