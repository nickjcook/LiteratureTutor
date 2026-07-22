import { useState, useEffect, useCallback } from "react";
import type { AuthUser } from "@workspace/api-client-react";

export type { AuthUser };

interface AuthState {
  user: AuthUser | null;
  /** The admin's own identity while impersonating another user, else null. */
  impersonator: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [impersonator, setImpersonator] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/user", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{
          user: AuthUser | null;
          impersonator?: AuthUser | null;
        }>;
      })
      .then((data) => {
        if (!cancelled) {
          setUser(data.user ?? null);
          setImpersonator(data.impersonator ?? null);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setUser(null);
          setImpersonator(null);
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(() => {
    // Interim local auth: send users to the in-app email+password page rather
    // than the Replit OIDC flow (testers have no Replit accounts). The OIDC
    // routes remain live server-side as a fallback.
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "");
    window.location.href = `${base}/login`;
  }, []);

  const logout = useCallback(() => {
    window.location.href = "/api/logout";
  }, []);

  return {
    user,
    impersonator,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
  };
}
