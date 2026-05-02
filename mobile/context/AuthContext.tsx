import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import api from '../services/api';

type AuthUser = {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  NIC: string;
  dateOfBirth: string;
  gender: string;
  address: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  updateUser: (patch: Partial<AuthUser>) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const memoryStore = new Map<string, string>();

async function safeGetItem(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function safeSetItem(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

async function safeMultiRemove(keys: string[]) {
  try {
    await (AsyncStorage as any).multiRemove(keys);
  } catch {
    for (const k of keys) memoryStore.delete(k);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function hydrate() {
      try {
        const storedUser = await safeGetItem('user');
        if (!isMounted) {
          return;
        }

        if (storedUser) {
          setUser(JSON.parse(storedUser) as AuthUser);
        } else {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void hydrate();

    return () => {
      isMounted = false;
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    return {
      user,
      loading,
      async login(email: string, password: string) {
        const response = await api.post('/api/auth/login', { email, password });
        const { accessToken, refreshToken, user: responseUser } = response.data as {
          accessToken: string;
          refreshToken: string;
          user: AuthUser;
        };

        await safeSetItem('accessToken', accessToken);
        await safeSetItem('refreshToken', refreshToken);
        await safeSetItem('user', JSON.stringify(responseUser));
        setUser(responseUser);
      },
      async register(payload: RegisterPayload) {
        await api.post('/api/auth/register', payload);

        await safeMultiRemove(['accessToken', 'refreshToken', 'user']);
        setUser(null);
      },
      async updateUser(patch: Partial<AuthUser>) {
        setUser((current) => {
          const next = current ? { ...current, ...patch } : current;
          if (next) {
            void safeSetItem('user', JSON.stringify(next));
          }
          return next;
        });
      },
      async logout() {
        try {
          await api.post('/api/auth/logout');
        } finally {
          await safeMultiRemove(['accessToken', 'refreshToken', 'user']);
          setUser(null);
        }
      },
    };
  }, [loading, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
