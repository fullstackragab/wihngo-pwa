"use client";

import { setAuthErrorHandler } from "@/services/api-helper";
import { AuthResponseDto, User } from "@/types/user";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (authData: AuthResponseDto) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  validateAuth: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";
const USER_KEY = "auth_user";
const TOKEN_EXPIRY_KEY = "auth_token_expiry";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadAuthData();
  }, []);

  useEffect(() => {
    const handleAuthError = () => {
      logout();
    };
    setAuthErrorHandler(handleAuthError);
  }, []);

  const loadAuthData = () => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Error loading auth data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = (authData: AuthResponseDto) => {
    try {
      const userData: User = {
        userId: authData.userId,
        name: authData.name,
        email: authData.email,
        profileImageUrl: authData.profileImageUrl,
        profileImageS3Key: authData.profileImageS3Key,
      };

      const expiryTime = authData.expiresAt
        ? new Date(authData.expiresAt).getTime()
        : Date.now() + 60 * 60 * 1000;

      localStorage.setItem(TOKEN_KEY, authData.token);
      localStorage.setItem(REFRESH_TOKEN_KEY, authData.refreshToken);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());

      setToken(authData.token);
      setUser(userData);
    } catch (error) {
      console.error("Error saving auth data:", error);
      throw error;
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_EXPIRY_KEY);

      setToken(null);
      setUser(null);
    } catch (error) {
      console.error("Error clearing auth data:", error);
      throw error;
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  const validateAuth = (): boolean => {
    try {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const expiryTimeStr = localStorage.getItem(TOKEN_EXPIRY_KEY);

      if (!storedToken) {
        return false;
      }

      if (expiryTimeStr) {
        const expiryTime = parseInt(expiryTimeStr, 10);
        if (Date.now() > expiryTime) {
          logout();
          return false;
        }
      }

      return true;
    } catch (error) {
      console.error("Error validating auth:", error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
    validateAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
