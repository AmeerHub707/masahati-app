import { StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import { useAuth } from '../../src/context/AuthContext';
import { COLORS, FONT, SPACING } from '../../src/constants/theme';

export default function Profile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, signOut } = useAuth();

  const handleAuthAction = async () => {
    if (isAuthenticated) {
      await signOut();
      router.replace('/login');
      return;
    }
    router.push('/login');
  };

  const initial = (user?.name || 'ز').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { paddingTop: insets.top + SPACING.huge }]}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <Text style={styles.name}>{user?.name || 'زائر'}</Text>
      <Text style={styles.email}>{user?.email || 'لم تسجل الدخول بعد'}</Text>

      <Button
        title={isAuthenticated ? 'تسجيل الخروج' : 'تسجيل الدخول'}
        variant={isAuthenticated ? 'ghost' : 'primary'}
        onPress={handleAuthAction}
        style={styles.action}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.brandSoft,
    borderWidth: 2,
    borderColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '800',
    color: COLORS.brand,
  },
  name: {
    fontSize: FONT.lg,
    fontWeight: '700',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  email: {
    marginTop: SPACING.xs,
    fontSize: FONT.base,
    color: COLORS.textMuted,
  },
  action: {
    marginTop: SPACING.xxl,
    alignSelf: 'stretch',
  },
});
