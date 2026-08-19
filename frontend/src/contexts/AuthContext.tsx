'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  loginWithGoogle: (
    email?: string,
    name?: string,
    avatar?: string,
    credential?: string,
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    localStorage.removeItem('kanban_token');
    localStorage.removeItem('kanban_user');
    setUser(null);
    setToken(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);

    const savedToken = localStorage.getItem('kanban_token');
    const savedUser = localStorage.getItem('kanban_user');

    if (savedToken && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
      } catch (err) {
        console.error('Error parsing stored user data:', err);
        logout();
      }
    }

    setIsLoading(false);

    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = async (email: string, password?: string) => {
    try {
      const res = await api.login(email, password);
      setUser(res.user);
      setToken(res.accessToken);
      localStorage.setItem('kanban_token', res.accessToken);
      localStorage.setItem('kanban_user', JSON.stringify(res.user));
    } catch (err) {
      console.error('Failed to login:', err);
      throw err;
    }
  };

  const loginAsGuest = async () => {
    try {
      const res = await api.guestLogin();
      setUser(res.user);
      setToken(res.accessToken);
      localStorage.setItem('kanban_token', res.accessToken);
      localStorage.setItem('kanban_user', JSON.stringify(res.user));
    } catch (err) {
      console.error('Failed to login as guest:', err);
      throw err;
    }
  };

  const loginWithGoogle = async (
    email?: string,
    name?: string,
    avatar?: string,
    credential?: string,
  ) => {
    try {
      const res = await api.loginGoogle({ email, name, avatar, credential });
      setUser(res.user);
      setToken(res.accessToken);
      localStorage.setItem('kanban_token', res.accessToken);
      localStorage.setItem('kanban_user', JSON.stringify(res.user));
    } catch (err) {
      console.error('Failed to login with Google:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginAsGuest,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
