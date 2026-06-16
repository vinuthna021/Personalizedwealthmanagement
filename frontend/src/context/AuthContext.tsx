import React, { createContext, useState, useEffect } from 'react';
import apiClient from '../lib/api_client';
import { User, RiskProfile } from '../types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  updateRiskProfile: (risk: RiskProfile) => Promise<void>;
  verifyKYCMock: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCurrentUser = async () => {
    try {
      const response = await apiClient.get('/users/me');
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();

    const handleForceLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth-logout-required', handleForceLogout);
    return () => {
      window.removeEventListener('auth-logout-required', handleForceLogout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      setUser(response.data);
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
      await apiClient.post('/auth/register', data);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const updateProfile = async (data: any) => {
    try {
      const response = await apiClient.put('/users/me', data);
      setUser(response.data);
    } catch (error) {
      throw error;
    }
  };

  const updateRiskProfile = async (risk_profile: RiskProfile) => {
    try {
      const response = await apiClient.put('/users/me/risk', { risk_profile });
      setUser(response.data);
    } catch (error) {
      throw error;
    }
  };

  const verifyKYCMock = async () => {
    try {
      const response = await apiClient.post('/users/me/kyc/verify');
      setUser(response.data);
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        updateRiskProfile,
        verifyKYCMock,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
