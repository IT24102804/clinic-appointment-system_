import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";

import { setAuthToken, setRefreshSessionHandler, setRefreshToken } from "@/services/api-client";
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
const REFRESH_TOKEN_KEY = "clinic-app-refresh-token";
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

async function persistTokens(accessToken: string, refreshToken: string) {
  setAuthToken(accessToken);
  setRefreshToken(refreshToken);
  await AsyncStorage.multiSet([
    [TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [storedRefreshToken, setStoredRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setRefreshSessionHandler(async (accessToken, nextRefreshToken) => {
      await persistTokens(accessToken, nextRefreshToken);
      setToken(accessToken);
      setStoredRefreshToken(nextRefreshToken);
    });

    async function restoreSession() {
      try {
        const [[, storedToken], [, restoredRefreshToken], [, storedUser]] = await AsyncStorage.multiGet([
          TOKEN_KEY,
          REFRESH_TOKEN_KEY,
          USER_KEY,
        ]);

        if (storedToken && storedUser) {
          const parsedUser = JSON.parse(storedUser) as User;
          setAuthToken(storedToken);
          setRefreshToken(restoredRefreshToken);
          setToken(storedToken);
          setStoredRefreshToken(restoredRefreshToken);
          setUser(parsedUser);
        }
      } finally {
        setLoading(false);
      }
    }

    void restoreSession();

    return () => setRefreshSessionHandler(null);
  }, []);

  async function login(payload: Pick<AuthPayload, "email" | "password">) {
    const session = await loginRequest(payload);
    const accessToken = session.accessToken || session.token;
    await persistSession(accessToken, session.user);
    await persistTokens(accessToken, session.refreshToken);
    setToken(accessToken);
    setStoredRefreshToken(session.refreshToken);
    setUser(session.user);
    return session.user;
  }

  async function registerStaff(payload: Required<AuthPayload>) {
    const session = await registerStaffRequest(payload);
    const accessToken = session.accessToken || session.token;
    await persistSession(accessToken, session.user);
    await persistTokens(accessToken, session.refreshToken);
    setToken(accessToken);
    setStoredRefreshToken(session.refreshToken);
    setUser(session.user);
    return session.user;
  }

  async function registerPatient(payload: PatientRegisterPayload) {
    const session = await registerPatientRequest(payload);
    const accessToken = session.accessToken || session.token;
    await persistSession(accessToken, session.user);
    await persistTokens(accessToken, session.refreshToken);
    setToken(accessToken);
    setStoredRefreshToken(session.refreshToken);
    setUser(session.user);
    return session.user;
  }

  async function logout() {
    await clearRequestToken(storedRefreshToken);
    setToken(null);
    setStoredRefreshToken(null);
    setUser(null);
    await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
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
