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
  const [authChanged, setAuthChanged] = useState(0);

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
      console.log('🔐 Setting auth status to authenticated');
      setAuthStatus({ isAuthenticated: true, userId: result.userId });
      setAuthChanged(prev => {
        console.log('🔄 Incrementing authChanged from', prev, 'to', prev + 1);
        return prev + 1;
      });
      setLoading(false);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Login failed';
      setError(errorMsg);
      setLoading(false);
      throw new Error(errorMsg);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await authAPI.logout();
      console.log('🔐 Setting auth status to unauthenticated');
      setAuthStatus({ isAuthenticated: false, userId: null });
      setAuthChanged(prev => prev + 1);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
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
    authChanged,
  };
};