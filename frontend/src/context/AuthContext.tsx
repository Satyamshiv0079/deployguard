import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { AuthResponse, RoleType, UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  register: (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    department?: string;
    roles?: string[];
  }) => Promise<void>;
  logout: () => void;
  hasRole: (role: RoleType) => boolean;
  isAdmin: boolean;
  isProjectManager: boolean;
  isDeveloper: boolean;
  isReviewer: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('deployguard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('deployguard_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem('deployguard_token');
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.success) {
            setUser(res.data.data);
            localStorage.setItem('deployguard_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session expired or invalid token', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('auth-unauthorized', handleUnauthorized);
    checkAuth();

    return () => {
      window.removeEventListener('auth-unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await api.post<{ success: boolean; data: AuthResponse }>('/auth/login', credentials);
    if (res.data?.success && res.data.data) {
      const authData = res.data.data;
      setToken(authData.token);
      localStorage.setItem('deployguard_token', authData.token);

      const userProfile: UserProfile = {
        id: authData.id,
        username: authData.username,
        email: authData.email,
        fullName: authData.fullName,
        department: authData.department,
        active: true,
        roles: authData.roles,
        createdAt: new Date().toISOString(),
      };
      setUser(userProfile);
      localStorage.setItem('deployguard_user', JSON.stringify(userProfile));
    }
  };

  const register = async (data: {
    username: string;
    email: string;
    password: string;
    fullName: string;
    department?: string;
    roles?: string[];
  }) => {
    await api.post('/auth/register', data);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('deployguard_token');
    localStorage.removeItem('deployguard_user');
  };

  const hasRole = (role: RoleType): boolean => {
    return user?.roles?.includes(role) ?? false;
  };

  const isAdmin = hasRole('ROLE_ADMIN');
  const isProjectManager = hasRole('ROLE_PROJECT_MANAGER') || isAdmin;
  const isDeveloper = hasRole('ROLE_DEVELOPER') || isAdmin;
  const isReviewer = hasRole('ROLE_REVIEWER') || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
        isAdmin,
        isProjectManager,
        isDeveloper,
        isReviewer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
