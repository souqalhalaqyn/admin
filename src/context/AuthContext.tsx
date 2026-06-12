import { getApiClient, setApiToken, configureApi } from "@/api";
import { getErrorMessage } from "@/api/utils/errorHandler";
import { APP_PREFIX } from "@/config/constants";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

const AUTH_STORAGE_KEY = `${APP_PREFIX}:auth`;
const STORAGE_PREFIX = `${APP_PREFIX}:`;

async function clearAppStorage() {
  const keys = await AsyncStorage.getAllKeys();
  const toRemove = keys.filter((k) => k.startsWith(STORAGE_PREFIX));
  if (toRemove.length > 0) await AsyncStorage.multiRemove(toRemove);
}

interface AuthUser {
  _id: string;
  phone: string;
  role: string;
  name?: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const tokensRef = useRef<{ accessToken: string; refreshToken: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as { user: AuthUser; accessToken: string; refreshToken: string };
          setUser(parsed.user);
          tokensRef.current = { accessToken: parsed.accessToken, refreshToken: parsed.refreshToken };
          setApiToken(parsed.accessToken);
        }
      } catch {
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const onUnauthorized = useCallback(() => {
    tokensRef.current = null;
    clearAppStorage().then(() => {
      setUser(null);
      setApiToken(null);
    });
  }, []);

  useEffect(() => {
    configureApi({
      onUnauthorized,
      getRefreshToken: () => tokensRef.current?.refreshToken ?? null,
      onRefresh: (accessToken: string, refreshToken: string) => {
        const currentUser = user;
        if (currentUser) {
          tokensRef.current = { accessToken, refreshToken };
          AsyncStorage.setItem(
            AUTH_STORAGE_KEY,
            JSON.stringify({ user: currentUser, accessToken, refreshToken }),
          );
        }
      },
    });
  }, [onUnauthorized, user]);

  const saveAuth = async (userData: AuthUser, accessToken: string, refreshToken: string) => {
    tokensRef.current = { accessToken, refreshToken };
    await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user: userData, accessToken, refreshToken }));
    setUser(userData);
    setApiToken(accessToken);
  };

  const login = useCallback(async (phone: string, password: string) => {
    const client = getApiClient();
    try {
      const response = await client.post("auth/login", { phone, password });
      const { accessToken, refreshToken, user: userData } = response.data.data as {
        accessToken: string; refreshToken: string; user: AuthUser;
      };
      await saveAuth(userData, accessToken, refreshToken);
    } catch (error) {
      throw new Error(getErrorMessage(error, "Invalid phone or password"));
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await getApiClient().post("auth/logout");
    } catch {
    } finally {
      tokensRef.current = null;
      await clearAppStorage();
      setUser(null);
      setApiToken(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
