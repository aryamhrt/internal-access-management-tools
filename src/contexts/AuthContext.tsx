import React, { createContext, useContext, useState, useEffect } from "react";
import type { User, AuthContextType } from "@/types";

import { STORAGE_KEYS } from "@/lib/constants";

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authExpiresAt, setAuthExpiresAt] = useState<number | null>(null);

  const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);
      const expiresAtRaw = localStorage.getItem(STORAGE_KEYS.AUTH_EXPIRES_AT);

      const parsedExpiresAt = expiresAtRaw ? Number(expiresAtRaw) : NaN;
      const hasValidExpiresAt = Number.isFinite(parsedExpiresAt);

      if (token && savedUser) {
        try {
          // Enforce session TTL
          if (hasValidExpiresAt && Date.now() > parsedExpiresAt) {
            logout();
            setIsLoading(false);
            return;
          }

          const restoredUser = JSON.parse(savedUser);
          if (typeof restoredUser?.can_manage_users !== "boolean") {
            restoredUser.can_manage_users = false;
          }
          setUser(restoredUser);

          // Migration: if older sessions don't have expiry yet, start TTL from now
          const nextExpiresAt = hasValidExpiresAt
            ? parsedExpiresAt
            : Date.now() + SESSION_TTL_MS;
          if (!hasValidExpiresAt) {
            localStorage.setItem(
              STORAGE_KEYS.AUTH_EXPIRES_AT,
              String(nextExpiresAt),
            );
          }
          setAuthExpiresAt(nextExpiresAt);

          // For now, just trust the stored token (can add verification later)
          // TODO: Add token verification endpoint later
        } catch (error) {
          console.error("Failed to restore auth state:", error);
          logout();
        }
      }

      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Auto-logout when session expires (even if tab stays open)
  useEffect(() => {
    if (!user || !authExpiresAt) return;

    const msUntilExpiry = authExpiresAt - Date.now();
    if (msUntilExpiry <= 0) {
      logout();
      return;
    }

    const timeoutId = window.setTimeout(() => {
      logout();
    }, msUntilExpiry);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [user, authExpiresAt]);

  // Re-check expiry when tab becomes active
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;
      const expiresAtRaw = localStorage.getItem(STORAGE_KEYS.AUTH_EXPIRES_AT);
      const parsed = expiresAtRaw ? Number(expiresAtRaw) : NaN;
      if (Number.isFinite(parsed) && Date.now() > parsed) {
        logout();
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const login = async (_email: string, _password: string): Promise<void> => {
    // This function is kept for API compatibility but not used for Google OAuth
    // Google OAuth is handled through googleLogin function
    throw new Error("Use googleLogin for authentication");
  };

  const googleLogin = async (credential: string): Promise<void> => {
    try {
      // Import api here to avoid circular dependency
      const { default: api } = await import("@/lib/api");

      const response = await api.auth.googleLogin(credential);

      if (response.success && response.data && response.data.user) {
        console.log(
          "✅ Login successful, received user data:",
          response.data.user,
        );

        // Validate user data
        const userData = response.data.user;
        if (!userData.name || userData.name.trim() === "") {
          console.warn(
            "⚠️ User name is empty, check your Notion Users database",
          );
        }
        if (!userData.role || userData.role.trim() === "") {
          console.warn("⚠️ User role is empty, defaulting to employee");
          userData.role = "employee";
        }

        if (typeof userData.can_manage_users !== "boolean") {
          userData.can_manage_users = false;
        }

        // Store auth data
        const expiresAt = Date.now() + SESSION_TTL_MS;
        localStorage.setItem(
          STORAGE_KEYS.AUTH_TOKEN,
          response.data.token || credential,
        );
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        localStorage.setItem(STORAGE_KEYS.AUTH_EXPIRES_AT, String(expiresAt));
        setUser(userData);
        setAuthExpiresAt(expiresAt);
      } else {
        console.error("❌ Login failed, response:", response);
        throw new Error(response.error?.message || "Authentication failed");
      }
    } catch (error) {
      console.error("Google login error:", error);
      throw error;
    }
  };

  const logout = (): void => {
    // Clear storage
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_DATA);
    localStorage.removeItem(STORAGE_KEYS.AUTH_EXPIRES_AT);

    // Reset state
    setUser(null);
    setAuthExpiresAt(null);
  };

  const value: AuthContextType = {
    user,
    login,
    googleLogin,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
