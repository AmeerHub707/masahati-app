import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import GoogleAuthButton from '../../src/components/GoogleAuthButton';
import TextField from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { consumeSessionExpired, routeForUser } from '../../src/lib/authStore';
import { validateLogin } from '../../src/utils/validation';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/constants/theme';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [expired] = useState(() => consumeSessionExpired());
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const nextErrors = validateLogin({ login: identifier, password });
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      const session = await signIn({ login: identifier.trim(), password });
      const target = routeForUser(session.user);
      if (__DEV__) {
        console.log(
          '[auth] route target:',
          target,
          '| role:',
          session.user?.role,
          '| status:',
          session.user?.status
        );
      }
      if (target === '/login') {
        const diag = __DEV__
          ? `\n[role=${String(session.user?.role ?? 'none')} | status=${String(
              session.user?.status ?? 'none'
            )}]`
          : '';
        setFormError(
          'تعذّر التحقق من نوع الحساب. تأكد من بيانات حسابك أو تواصل مع الدعم.' + diag
        );
        return;
      }
      router.replace(target);
    } catch (error) {
      if (error.fieldErrors) {
        setErrors((prev) => ({ ...prev, ...error.fieldErrors }));
      } else {
        setFormError(error.message || 'تعذر تسجيل الدخول');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + SPACING.xxl, paddingBottom: insets.bottom + SPACING.xxl },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Image
            source={require('../../assets/images/Logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>تسجيل الدخول</Text>
          <Text style={styles.subtitle}>أهلاً بعودتك إلى مساحاتي</Text>
        </View>

        <View style={styles.form}>
          <TextField
            label="البريد الإلكتروني أو رقم الهاتف"
            value={identifier}
            onChangeText={setIdentifier}
            placeholder="name@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
            error={errors.login}
          />

          <TextField
            label="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            error={errors.password}
          />

          {expired && !formError ? (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>انتهت جلستك السابقة. سجّل الدخول من جديد.</Text>
            </View>
          ) : null}

          {formError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <Button title="دخول" onPress={handleSubmit} loading={loading} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>أو</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleAuthButton />
        </View>

        <View style={styles.footer}>
          <Link href="/register" asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.footerText}>
                ليس لديك حساب؟ <Text style={styles.footerStrong}>إنشاء حساب</Text>
              </Text>
            </Pressable>
          </Link>
          {__DEV__ ? <Text style={styles.devTag}>dashboard build</Text> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  logo: {
    width: 210,
    height: 70,
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  subtitle: {
    marginTop: SPACING.sm,
    fontSize: FONT.base,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
  form: {
    marginBottom: SPACING.xl,
  },
  errorBox: {
    backgroundColor: COLORS.dangerSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: FONT.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoBox: {
    backgroundColor: COLORS.warningSoft,
    borderRadius: RADIUS.sm,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoText: {
    color: '#B54708',
    fontSize: FONT.sm,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
  footer: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  footerText: {
    fontSize: FONT.base,
    color: COLORS.textMuted,
    textAlign: 'center',
    writingDirection: 'rtl',
  },
  footerStrong: {
    color: COLORS.brand,
    fontWeight: '700',
  },
  devTag: {
    fontSize: 10,
    color: '#B0B0B8',
    letterSpacing: 1,
  },
  guest: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
    writingDirection: 'rtl',
  },
});
