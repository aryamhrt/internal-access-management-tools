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

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const savedUser = localStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (token && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
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

        // Store auth data
        localStorage.setItem(
          STORAGE_KEYS.AUTH_TOKEN,
          response.data.token || credential,
        );
        localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(userData));
        setUser(userData);
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

    // Reset state
    setUser(null);
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
