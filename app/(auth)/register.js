import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import TextField from '../../src/components/TextField';
import { useAuth } from '../../src/context/AuthContext';
import { validateRegister } from '../../src/utils/validation';
import { COLORS, FONT, RADIUS, SPACING } from '../../src/constants/theme';

export default function Register() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signUp } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const nextErrors = validateRegister({ name, email, phone, password, confirm });
    setErrors(nextErrors);
    setFormError('');

    if (Object.keys(nextErrors).length > 0) return;

    setLoading(true);
    try {
      await signUp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
      });
      router.replace('/home');
    } catch (error) {
      setFormError(error.message || 'تعذر إنشاء الحساب');
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
        <Text style={styles.title}>إنشاء حساب</Text>
        <Text style={styles.subtitle}>أنشئ حسابك للبدء في الحجز</Text>

        <View style={styles.form}>
          <TextField
            label="الاسم الكامل"
            value={name}
            onChangeText={setName}
            placeholder="الاسم الكامل"
            autoComplete="name"
            error={errors.name}
          />

          <TextField
            label="البريد الإلكتروني"
            value={email}
            onChangeText={setEmail}
            placeholder="example@mail.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            error={errors.email}
          />

          <TextField
            label="رقم الهاتف"
            value={phone}
            onChangeText={setPhone}
            placeholder="+964 7XX XXX XXXX"
            keyboardType="phone-pad"
            autoComplete="tel"
            error={errors.phone}
          />

          <TextField
            label="كلمة المرور"
            value={password}
            onChangeText={setPassword}
            placeholder="6 أحرف على الأقل"
            secureTextEntry
            error={errors.password}
          />

          <TextField
            label="تأكيد كلمة المرور"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="أعد إدخال كلمة المرور"
            secureTextEntry
            error={errors.confirm}
          />

          {formError ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          <Button title="إنشاء الحساب" onPress={handleSubmit} loading={loading} />
        </View>

        <Pressable hitSlop={8} onPress={() => router.replace('/login')} style={styles.footer}>
          <Text style={styles.footerText}>
            لديك حساب؟ <Text style={styles.footerStrong}>تسجيل الدخول</Text>
          </Text>
        </Pressable>
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
  title: {
    fontSize: FONT.xl,
    fontWeight: '800',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  subtitle: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    fontSize: FONT.base,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
  form: {
    marginBottom: SPACING.lg,
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
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
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
});
