import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as authService from '../features/auth/services';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const signIn = useCallback(async ({ email, password }) => {
    setIsLoading(true);
    try {
      const session = await authService.login({ email, password });
      setUser(session.user);
      setToken(session.token);
      return session;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async ({ name, email, phone, password }) => {
    setIsLoading(true);
    try {
      const session = await authService.register({ name, email, phone, password });
      setUser(session.user);
      setToken(session.token);
      return session;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await authService.googleLogin();
      setUser(session.user);
      setToken(session.token);
      return session;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    const currentToken = token;
    setUser(null);
    setToken(null);
    await authService.logout(currentToken);
  }, [token]);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: Boolean(user),
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }),
    [user, token, isLoading, signIn, signUp, signInWithGoogle, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return context;
}
