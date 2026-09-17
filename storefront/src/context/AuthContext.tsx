"use client";

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { api, post } from "@/lib/api";
import type { User } from "@/lib/types";

interface AuthCtx {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<{ user: User }>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  setUserLocal: (u: User) => void;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  ready: false,
  login: async () => {
    throw new Error("no montado");
  },
  register: async () => {},
  logout: () => {},
  isAdmin: false,
  setUserLocal: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("aao_token");
    const saved = localStorage.getItem("aao_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        /* ignore */
      }
    }
    if (token) {
      api<User>("/auth/me", { auth: true })
        .then((u) => {
          setUser(u);
          localStorage.setItem("aao_user", JSON.stringify(u));
        })
        .catch(() => {
          localStorage.removeItem("aao_token");
          localStorage.removeItem("aao_user");
          setUser(null);
        })
        .finally(() => setReady(true));
    } else {
      setReady(true);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await post<{ access_token: string; user: User }>("/auth/login", { email, password });
    localStorage.setItem("aao_token", res.access_token);
    localStorage.setItem("aao_user", JSON.stringify(res.user));
    setUser(res.user);
    return { user: res.user };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await post("/auth/register", { name, email, password });
    await login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.removeItem("aao_token");
    localStorage.removeItem("aao_user");
    setUser(null);
  }, []);

  const setUserLocal = useCallback((u: User) => {
    setUser(u);
    localStorage.setItem("aao_user", JSON.stringify(u));
  }, []);

  const isAdmin = !!user && user.role !== "cliente";

  return (
    <Ctx.Provider value={{ user, ready, login, register, logout, isAdmin, setUserLocal }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
