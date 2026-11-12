import { StyleSheet, Text, View } from 'react-native';
import { Link } from 'expo-router';
import { COLORS, FONT, SPACING } from '../src/constants/theme';

export default function NotFound() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>الصفحة غير موجودة</Text>
      <Text style={styles.description}>الرابط الذي فتحته غير متاح.</Text>
      <Link href="/" style={styles.link}>
        العودة للرئيسية
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    gap: SPACING.sm,
  },
  title: {
    fontSize: FONT.lg,
    fontWeight: '800',
    color: COLORS.text,
    writingDirection: 'rtl',
  },
  description: {
    fontSize: FONT.base,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
  link: {
    marginTop: SPACING.lg,
    fontSize: FONT.base,
    fontWeight: '700',
    color: COLORS.brand,
    writingDirection: 'rtl',
  },
});
