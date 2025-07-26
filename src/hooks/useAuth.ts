import { useState, useEffect, useCallback, useRef } from 'react';
import { authApi, userApi, User, LoginCredentials, RegisterCredentials } from '../services/api';
import { toast } from '@/hooks/use-toast';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>(() => {
    // Initialize state from sessionStorage
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        return {
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        };
      } catch (error) {
        console.error('[DEBUG] Error parsing user data:', error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        return {
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        };
      }
    }
    
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    };
  });

  const isMounted = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handle token invalidation
  useEffect(() => {
    const handleTokenInvalid = (event: CustomEvent) => {
      if (!isMounted.current) return;
      
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });

      toast({
        title: "Session Expired",
        description: event.detail.message || "Your session has expired. Please sign in again.",
        variant: "destructive",
      });
    };

    window.addEventListener('auth:tokenInvalid', handleTokenInvalid as EventListener);
    return () => {
      window.removeEventListener('auth:tokenInvalid', handleTokenInvalid as EventListener);
    };
  }, []);

  const refreshAuthState = useCallback(() => {
    if (!isMounted.current) return;

    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setState({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } catch (error) {
        console.error('[DEBUG] Error parsing user data during refresh:', error);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        setState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } else {
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    if (!isMounted.current) return;

    try {
      const { token, user } = await authApi.login(credentials);
      
      // Clear any existing data first
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Set new data
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      // Immediately update state after successful login
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return user;
    } catch (error) {
      console.error('[DEBUG] Login error:', error);
      throw error;
    }
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    if (!isMounted.current) return;

    try {
      const { token, user } = await authApi.register(credentials);
      
      // Clear any existing data first
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      
      // Set new data
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      // Immediately update state after successful registration
      setState({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      return user;
    } catch (error) {
      console.error('[DEBUG] Registration error:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    if (!isMounted.current) return;

    
    // Clear sessionStorage first
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    
    // Then clear state
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
    
    // Finally call the API logout
    authApi.logout();
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!isMounted.current) return;

    try {
      const updatedUser = await userApi.updateProfile(data);
      
      sessionStorage.setItem('user', JSON.stringify(updatedUser));
      setState(prev => ({
        ...prev,
        user: updatedUser,
      }));
      return updatedUser;
    } catch (error) {
      console.error('[DEBUG] Profile update error:', error);
      throw error;
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshAuthState,
  };
}; 