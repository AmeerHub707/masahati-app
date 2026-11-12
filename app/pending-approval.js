import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { COLORS, FONT, RADIUS, SPACING } from '../src/constants/theme';

export default function PendingApproval() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { status, signOut } = useAuth();

  if (status === 'anonymous') return <Redirect href="/login" />;

  const handleLogout = async () => {
    await signOut();
    router.replace('/login');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.iconWrap}>
        <Ionicons name="hourglass-outline" size={40} color={COLORS.warning} />
      </View>
      <Text style={styles.title}>حسابك قيد المراجعة</Text>
      <Text style={styles.description}>
        تم إنشاء حسابك بنجاح، وهو بانتظار موافقة الإدارة. سنفتح لك لوحة التحكم بمجرد اعتماد
        الحساب.
      </Text>
      <Pressable onPress={handleLogout} style={styles.action} accessibilityRole="button">
        <Text style={styles.actionText}>تسجيل الخروج</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: COLORS.warningSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  description: {
    marginTop: SPACING.sm,
    fontSize: FONT.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
    lineHeight: 23,
  },
  action: {
    marginTop: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.pill,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionText: {
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
});
