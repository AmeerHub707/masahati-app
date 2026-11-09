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
import GoogleButton from '../../src/components/GoogleButton';
import TextField from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { validateLogin } from '../../src/utils/validation';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/constants/theme';

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async () => {
    const nextErrors = validateLogin({ email, password });
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await signIn({ email: email.trim(), password });
      router.replace('/home');
    } catch (error) {
      setFormError(error.message || 'تعذر تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setFormError('');
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/home');
    } catch (error) {
      setFormError(error.message || 'تعذر تسجيل الدخول عبر Google');
    } finally {
      setGoogleLoading(false);
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
            label="البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            error={errors.email}
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

          <GoogleButton onPress={handleGoogle} loading={googleLoading} />
        </View>

        <View style={styles.footer}>
          <Link href="/register" asChild>
            <Pressable hitSlop={8}>
              <Text style={styles.footerText}>
                ليس لديك حساب؟ <Text style={styles.footerStrong}>إنشاء حساب</Text>
              </Text>
            </Pressable>
          </Link>

          <Pressable hitSlop={8} onPress={() => router.replace('/home')}>
            <Text style={styles.guest}>المتابعة كضيف</Text>
          </Pressable>
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
  guest: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    textDecorationLine: 'underline',
    writingDirection: 'rtl',
  },
});
