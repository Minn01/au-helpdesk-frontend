import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/auth.api";
import type { AuthState } from "../types/auth";
import type { User } from "../types/user";
import { unauthorizedEvent } from "../api/http.client";

const AuthContext = createContext<AuthState | null>(null);
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { authApi.getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setIsLoading(false)); }, []);
  useEffect(() => { const clearSession = () => setUser(null); window.addEventListener(unauthorizedEvent, clearSession); return () => window.removeEventListener(unauthorizedEvent, clearSession); }, []);
  const value = useMemo<AuthState>(() => ({ user, isAuthenticated: Boolean(user), isLoading, startMicrosoftLogin: authApi.startMicrosoftLogin, logout: async () => { await authApi.logout(); setUser(null); } }), [user, isLoading]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
