import { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import type { AuthStatus } from '../../../shared/types';

export const useAuth = () => {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    userId: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkAuthStatus = async () => {
    try {
      console.log('🔐 Checking auth status...');
      setLoading(true);
      setError(null);
      const status = await authAPI.getStatus();
      console.log('✅ Auth status received:', status);
      setAuthStatus(status);
    } catch (err) {
      console.error('❌ Auth check failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to check auth status');
      setAuthStatus({ isAuthenticated: false, userId: null });
    } finally {
      setLoading(false);
    }
  };

  const login = async (password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authAPI.login(password);
      setAuthStatus({ isAuthenticated: true, userId: result.userId });
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      throw new Error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.logout();
      setAuthStatus({ isAuthenticated: false, userId: null });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  return {
    ...authStatus,
    loading,
    error,
    login,
    logout,
    checkAuthStatus,
  };
};