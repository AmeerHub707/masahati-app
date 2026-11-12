import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as auth from '../lib/authStore';
import { hydrate } from '../lib/platform/storage';
import { registerSessionExpiredHandler } from '../lib/api';

const AuthContext = createContext(null);

function statusFor(user) {
  if (!user) return 'anonymous';
  const role = auth.normalizeRole(user.role);
  // Pending approval is an owner-only state. Customers always get the
  // dashboard once their role is known, regardless of a profile `status`.
  if (role === 'space_owner') {
    return String(user.status || '').toLowerCase() === 'pending' ? 'pending' : 'owner';
  }
  if (role === 'customer') return 'authenticated';
  if (String(user.status || '').toLowerCase() === 'pending') return 'pending';
  // A token with no recognised role must never reach the customer dashboard.
  return 'unknown';
}

export function AuthProvider({ children }) {
  const [status, setStatus] = useState('booting');
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;

    const applyUser = (nextUser, nextToken) => {
      setUser(nextUser || null);
      setToken(nextToken || null);
      setStatus(statusFor(nextUser));
    };

    registerSessionExpiredHandler(() => {
      if (!mounted.current) return;
      setUser(null);
      setToken(null);
      setStatus('anonymous');
    });

    (async () => {
      await hydrate();
      const storedToken = auth.getToken();
      if (!storedToken) {
        if (mounted.current) setStatus('anonymous');
        return;
      }

      // Show the cached session instantly, then verify it with /api/profile.
      // A cached user without a recognised role stays in `booting` until the
      // profile call decides where they belong.
      const cached = auth.getUser();
      if (mounted.current) {
        setUser(cached);
        setToken(storedToken);
        if (cached && auth.normalizeRole(cached.role)) {
          setStatus(statusFor(cached));
        }
      }

      const restored = await auth.restoreSession();
      if (!mounted.current) return;
      if (!auth.getToken()) {
        applyUser(null, null);
        return;
      }
      applyUser(restored || auth.getUser(), auth.getToken());
    })();

    return () => {
      mounted.current = false;
    };
  }, []);

  const signIn = useCallback(async ({ login, password }) => {
    setIsLoading(true);
    try {
      const session = await auth.login(login, password);
      setUser(session.user);
      setToken(session.token);
      setStatus(statusFor(session.user));
      return session;
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  const signUp = useCallback(async (payload) => {
    setIsLoading(true);
    try {
      const response = await auth.registerCustomer(payload);
      const data = response?.data ?? response ?? {};
      const nextToken = response?.token ?? data?.token ?? null;
      const nextUser = response?.user ?? data?.user ?? null;

      if (nextToken) {
        auth.setToken?.(nextToken);
        setUser(nextUser);
        setToken(nextToken);
        setStatus(statusFor(nextUser));
        return { ...response, token: nextToken, user: nextUser };
      }
      setStatus('pending');
      return { ...response, pending: true };
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async ({ idToken, role }) => {
    setIsLoading(true);
    try {
      const session = await auth.googleLogin(idToken, role);
      setUser(session.user);
      setToken(session.token);
      setStatus(statusFor(session.user));
      return session;
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    setToken(null);
    setStatus('anonymous');
    await auth.logout();
  }, []);

  const updateUser = useCallback((patch) => {
    if (!patch) return;
    setUser((prev) => {
      const next = { ...(prev || {}), ...patch };
      auth.setUser(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      status,
      user,
      token,
      isLoading,
      isAuthenticated: status === 'authenticated',
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateUser,
    }),
    [status, user, token, isLoading, signIn, signUp, signInWithGoogle, signOut, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
