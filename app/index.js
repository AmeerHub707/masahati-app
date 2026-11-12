import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import SplashIntro from '../src/components/SplashIntro';
import { useAuth } from '../src/context/AuthContext';
import { COLORS } from '../src/constants/theme';

export default function Index() {
  const router = useRouter();
  const { status } = useAuth();
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    if (!splashDone || status === 'booting') return;

    const target =
      status === 'owner'
        ? '/owner-unavailable'
        : status === 'pending'
          ? '/pending-approval'
          : status === 'authenticated'
            ? '/home'
            : '/login';

    router.replace(target);
  }, [splashDone, status, router]);

  return (
    <View style={styles.container}>
      <SplashIntro onFinish={handleSplashFinish} />
      {splashDone && status === 'booting' ? (
        <View style={styles.booting}>
          <ActivityIndicator color={COLORS.brand} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  booting: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white,
  },
});
