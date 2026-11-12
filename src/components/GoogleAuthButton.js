import { useCallback, useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import GoogleButton from './GoogleButton';
import { useAuth } from '../context/AuthContext';
import { routeForUser } from '../lib/authStore';
import { COLORS, FONT, RADIUS, SPACING } from '../constants/theme';

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';
const IS_EXPO_GO = Constants.executionEnvironment === 'storeClient';

let cachedSignin = null;

function loadGoogleSignin() {
  if (cachedSignin) return cachedSignin;
  try {
    const mod = require('@react-native-google-signin/google-signin');
    cachedSignin = mod?.GoogleSignin ?? null;
    return cachedSignin;
  } catch {
    return null;
  }
}

export default function GoogleAuthButton({ style }) {
  const router = useRouter();
  const { signInWithGoogle } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roleVisible, setRoleVisible] = useState(false);
  const [pendingToken, setPendingToken] = useState(null);

  const finish = useCallback(
    async (idToken, role) => {
      setLoading(true);
      setError('');
      try {
        const session = await signInWithGoogle({ idToken, role });
        const target = routeForUser(session.user);
        if (target === '/login') {
          setError('تعذّر التحقق من نوع الحساب. تواصل مع الدعم.');
          return;
        }
        setRoleVisible(false);
        router.replace(target);
      } catch (err) {
        if (err.status === 409 || err.code === 'NOT_REGISTERED') {
          setPendingToken(idToken);
          setRoleVisible(true);
        } else {
          setError(err.message || 'تعذر تسجيل الدخول عبر Google');
        }
      } finally {
        setLoading(false);
      }
    },
    [router, signInWithGoogle]
  );

  const handlePress = async () => {
    setError('');

    if (IS_EXPO_GO) {
      setError(
        'تسجيل الدخول عبر Google يحتاج نسخة تطوير (Development Build) ولا يعمل داخل Expo Go.'
      );
      return;
    }

    if (!WEB_CLIENT_ID) {
      setError('لم يتم إعداد Google Client ID في إعدادات التطبيق.');
      return;
    }

    const GoogleSignin = loadGoogleSignin();
    if (!GoogleSignin) {
      setError('وحدة تسجيل الدخول عبر Google غير مثبتة في هذه النسخة.');
      return;
    }

    setLoading(true);
    try {
      GoogleSignin.configure({
        webClientId: WEB_CLIENT_ID,
        offlineAccess: false,
        scopes: ['openid', 'profile', 'email'],
      });

      if (Platform.OS === 'android') {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const result = await GoogleSignin.signIn();

      if (!result || result.type === 'cancelled') return;

      let idToken = result.data?.idToken ?? null;
      if (!idToken) {
        const tokens = await GoogleSignin.getTokens().catch(() => null);
        idToken = tokens?.idToken ?? null;
      }

      if (!idToken) {
        setError('لم نتمكن من الحصول على رمز Google. تأكد من إعداد بيانات OAuth.');
        return;
      }

      await finish(idToken);
    } catch (err) {
      const code = err?.code;
      if (code === 'SIGN_IN_CANCELLED' || code === '12501') return;

      if (code === 'PLAY_SERVICES_NOT_AVAILABLE') {
        setError('خدمات Google Play غير متوفرة على هذا الجهاز.');
      } else if (code === 'DEVELOPER_ERROR' || code === '10') {
        setError('إعدادات Google غير متطابقة (DEVELOPER_ERROR). تحقق من SHA-1 واسم الحزمة.');
      } else {
        setError('تعذر إكمال تسجيل الدخول عبر Google.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={style}>
      <GoogleButton onPress={handlePress} loading={loading} />

      {error ? (
        <Text style={styles.error} accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}

      <Modal
        visible={roleVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setRoleVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>مرحباً بك في مساحاتي</Text>
            <Text style={styles.sheetSubtitle}>
              لم نجد بريدك مسجلاً بعد. اختر نوع الحساب لإنشائه:
            </Text>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => finish(pendingToken, 'customer')}
            >
              <Text style={styles.optionTitle}>عميل</Text>
              <Text style={styles.optionHint}>أبحث عن مساحة للحجز</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
              onPress={() => finish(pendingToken, 'space_owner')}
            >
              <Text style={styles.optionTitle}>صاحب مساحة</Text>
              <Text style={styles.optionHint}>أريد عرض مساحاتي للحجز</Text>
            </Pressable>

            <Pressable onPress={() => setRoleVisible(false)} style={styles.cancel} hitSlop={8}>
              <Text style={styles.cancelText}>إلغاء</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    marginTop: SPACING.md,
    fontSize: FONT.sm,
    color: COLORS.danger,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17, 24, 39, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    gap: SPACING.md,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sheetSubtitle: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginBottom: SPACING.sm,
  },
  option: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
  },
  optionPressed: {
    backgroundColor: COLORS.brandSoft,
    borderColor: COLORS.brand,
  },
  optionTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  optionHint: {
    marginTop: 2,
    fontSize: FONT.xs,
    color: COLORS.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  cancel: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  cancelText: {
    fontSize: FONT.base,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
});
