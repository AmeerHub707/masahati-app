import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  fetchDashboard,
  readDashboardCache,
  writeDashboardCache,
  toggleFavorite as toggleFavoriteApi,
} from '../lib/dashboard';
import { useAuth } from './AuthContext';

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const cached = useRef(readDashboardCache());
  const [data, setData] = useState(cached.current);
  const [status, setStatus] = useState(cached.current ? 'ready' : 'loading');
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const mounted = useRef(true);
  const { status: authStatus } = useAuth();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Reads never throw: fetchDashboard resolves with an `error` field.
  const load = useCallback(async () => {
    try {
      const result = await fetchDashboard();
      if (!mounted.current) return;
      setData(result);
      setStatus('ready');
      setError(result?.error || '');
    } catch (err) {
      if (!mounted.current) return;
      setStatus((prev) => (prev === 'loading' ? 'error' : prev));
      setError(err?.message || 'تعذّر تحميل بيانات لوحة التحكم.');
    }
  }, []);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    load();
  }, [authStatus, load]);

  // Keep the on-device cache in sync with every local change (name, picture,
  // favorite removal) so reopening the dashboard never shows stale data.
  useEffect(() => {
    if (data) writeDashboardCache(data);
  }, [data]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    if (mounted.current) setRefreshing(false);
  }, [load]);

  const toggleFavorite = useCallback(async (id, name) => {
    setTogglingId(id);
    // Optimistic removal, rollback only if the server rejects it.
    setData((prev) =>
      prev
        ? {
            ...prev,
            favorites: (prev.favorites || []).filter((f) => f.id !== id),
            stats: {
              ...prev.stats,
              savedFavorites: Math.max(0, (prev.stats.savedFavorites || 1) - 1),
            },
          }
        : prev
    );

    try {
      await toggleFavoriteApi(id);
    } catch {
      setData((prev) => {
        if (!prev) return prev;
        if ((prev.favorites || []).some((f) => f.id === id)) return prev;
        return {
          ...prev,
          favorites: [...(prev.favorites || []), { id, name, image: '', rating: 0, location: '', pricePerHour: 0 }],
          stats: {
            ...prev.stats,
            savedFavorites: (prev.stats.savedFavorites || 0) + 1,
          },
        };
      });
    } finally {
      if (mounted.current) setTogglingId(null);
    }
  }, []);

  const applyUserPatch = useCallback((patch) => {
    setData((prev) => (prev ? { ...prev, user: { ...prev.user, ...patch } } : prev));
  }, []);

  const value = useMemo(
    () => ({
      data,
      status,
      error,
      refreshing,
      togglingId,
      refresh,
      reload: load,
      toggleFavorite,
      applyUserPatch,
    }),
    [data, status, error, refreshing, togglingId, refresh, load, toggleFavorite, applyUserPatch]
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) throw new Error('useDashboard must be used inside <DashboardProvider>');
  return context;
}
