import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { isLoggedIn } from '../../src/lib/authStore';

export default function AppLayout() {
  const { status } = useAuth();

  if (__DEV__) console.log('[nav] (app) status:', status);

  // The root splash is still animating; render nothing meanwhile.
  if (status === 'booting') return null;

  // `isLoggedIn()` covers the same tick as login: the token is written before
  // React flushes the auth state, so we must not bounce back to /login.
  if (status === 'anonymous' && !isLoggedIn()) return <Redirect href="/login" />;
  if (status === 'unknown') return <Redirect href="/login" />;
  if (status === 'owner') return <Redirect href="/owner-unavailable" />;
  if (status === 'pending') return <Redirect href="/pending-approval" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#F7F7F8' },
      }}
    />
  );
}
