// ============================================================
// useAuth — Auth state, login, logout
// Wraps session cookie + localStorage for persistence
// ============================================================

"use client";

import { useState, useEffect, useCallback, createContext, useContext } from "react";
import { loginUser, isApiSuccess } from "@/lib/api";
import type { AuthUser, LoginPayload } from "@/types";
import { COOKIE_KEYS, SESSION_EXPIRY_MS, STORAGE_KEYS } from "@/lib/constants";
import { getCookie, setCookie, deleteCookie } from "@/lib/utils";

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  hasRole: (...roles: AuthUser["ROLE"][]) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

// ── Auth Provider ─────────────────────────────────────────────
// Place this in src/app/layout.tsx

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      const token = getCookie(COOKIE_KEYS.SESSION);
      if (stored && token) {
        setUser(JSON.parse(stored) as AuthUser);
      }
    } catch {
      // corrupted storage — ignore
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<{ success: boolean; error?: string }> => {
      const res = await loginUser(payload);
      if (isApiSuccess(res)) {
        const { user: authedUser, token } = res.data;
        setUser(authedUser);
        // Store token in cookie (read by middleware for route protection)
        setCookie(COOKIE_KEYS.SESSION, token, SESSION_EXPIRY_MS / 1000);
        // Store user profile in localStorage for rehydration
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(authedUser));
        return { success: true };
      }
      return { success: false, error: res.error };
    },
    []
  );

  const logout = useCallback(() => {
    setUser(null);
    deleteCookie(COOKIE_KEYS.SESSION);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    window.location.href = "/login";
  }, []);

  const hasRole = useCallback(
    (...roles: AuthUser["ROLE"][]): boolean => {
      if (!user) return false;
      return roles.includes(user.ROLE);
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
