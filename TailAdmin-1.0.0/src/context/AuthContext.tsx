import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_CONFIG, API_ENDPOINTS } from '../config/api.config';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
  isActive: boolean;
  createdDate: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initAuth = () => {
      try {
        const storedToken = localStorage.getItem('authToken') || localStorage.getItem('access_token') || localStorage.getItem('auth_token');
        const storedUserRaw = localStorage.getItem('authUser') || localStorage.getItem('user_info') || localStorage.getItem('auth_user');
        if (storedToken) {
          setToken(storedToken);
        }
        if (storedUserRaw) {
          const u = JSON.parse(storedUserRaw);
          setUser(u);
        } else if (storedToken) {
          try {
            const p = storedToken.split('.')[1] || '';
            const b64 = p.replace(/-/g, '+').replace(/_/g, '/');
            const json = atob(b64);
            const d = JSON.parse(json);
            const rid = String(d.sub || d.userId || d.userid || d.nameid || d['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] || '');
            const remail = String(d.email || d.upn || '');
            const rrole = String(d['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] || d.role || '');
            const rusername = String(d.username || d.name || (remail ? remail.split('@')[0] : ''));
            const rfullname = String(d.fullName || d.name || rusername);
            if (rid) {
              const u: User = { id: rid, username: rusername, email: remail, fullName: rfullname, role: rrole, avatar: '', isActive: true, createdDate: new Date().toISOString() };
              setUser(u);
              try {
                localStorage.setItem('authUser', JSON.stringify(u));
                localStorage.setItem('auth_user', JSON.stringify(u));
              } catch {}
            }
          } catch {}
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Clear corrupted data
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_info');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Make API call to login
      const response = await fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.login}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      
      // Assuming API returns: { user: User, token: string, refreshToken: string }
      const { user: userData, token: accessToken, refreshToken } = data;
      
      // Store auth data
      localStorage.setItem('authToken', accessToken);
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('auth_token', accessToken);
      localStorage.setItem('authUser', JSON.stringify(userData));
      localStorage.setItem('auth_user', JSON.stringify(userData));
      localStorage.setItem('user_info', JSON.stringify(userData));
      if (refreshToken && typeof refreshToken === 'string') {
        localStorage.setItem('refresh_token', refreshToken);
        localStorage.setItem('refreshToken', refreshToken);
      }
      
      // Update state
      setToken(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    try {
      // Clear stored data
      localStorage.removeItem('authToken');
      localStorage.removeItem('authUser');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_info');
      
      // Clear state
      setToken(null);
      setUser(null);
      
      // Optionally call logout API
      if (token) {
        fetch(`${API_CONFIG.baseURL}${API_ENDPOINTS.auth.logout}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }).catch(error => {
          console.warn('Logout API call failed:', error);
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('authUser', JSON.stringify(updatedUser));
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper hook for protecting routes
export const useRequireAuth = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = '/signin';
    }
  }, [isAuthenticated, isLoading]);

  return { isAuthenticated, isLoading, user };
};

// Helper hook for admin-only routes
export const useRequireAdmin = () => {
  const { isAuthenticated, isLoading, user } = useAuth();
  
  useEffect(() => {
      if (!isLoading) {
        if (!isAuthenticated) {
          window.location.href = '/signin';
        } else {
          const role = (user?.role || '').toLowerCase();
          if (role !== 'admin' && role !== 'teacher') {
            window.location.href = '/admin/unauthorized';
          }
        }
      }
  }, [isAuthenticated, isLoading, user]);

  return { isAuthenticated, isLoading, user, isAdmin: user?.role?.toLowerCase() === 'admin', isTeacher: user?.role?.toLowerCase() === 'teacher' };
};
