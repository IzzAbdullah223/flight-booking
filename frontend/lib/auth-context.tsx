"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiFetch, setAccessToken, setRefreshToken, getRefreshToken, decodeJwt } from "./api";

type User = { id: string; email: string; role: string; name: string } | null;

const AuthContext = createContext<{
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}>(null as any);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      setLoading(false);
      return;
    }
    apiFetch("/auth/refresh", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    })
      .then((data) => {
        setAccessToken(data.token);
        const decoded = decodeJwt(data.token);
        setUser(decoded?.user ?? null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const applyAuthResponse = (data: any) => {
    setAccessToken(data.token);
    setRefreshToken(data.refreshToken);
    const decoded = decodeJwt(data.token);
    setUser(decoded?.user ?? null);
  };

  const login = async (email: string, password: string) => {
    const data = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    applyAuthResponse(data);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await apiFetch("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    applyAuthResponse(data);
  };

  const logout = async () => {
    const refreshToken = getRefreshToken();
    await apiFetch("/auth/logout", {
      method: "POST",
      body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);