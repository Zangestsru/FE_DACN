import { useState, useEffect } from 'react';
import { authService } from '../../services/auth.service';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  fullName: string;
  role: string;
  avatar?: string;
}

export function useAuthUser(): { user: AuthUser | null } {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const userData = authService.getUser();
      setUser(userData);
    };

    // Initial check
    checkAuth();

    // Listen for auth changes
    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('auth:logged-in', handleAuthChange);
    window.addEventListener('auth:logged-out', handleAuthChange);

    return () => {
      window.removeEventListener('auth:logged-in', handleAuthChange);
      window.removeEventListener('auth:logged-out', handleAuthChange);
    };
  }, []);

  return { user };
}