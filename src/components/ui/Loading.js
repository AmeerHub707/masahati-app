import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { COLORS, FONT, SPACING } from '../../constants/theme';

export default function Loading({ label = 'جارٍ التحميل…' }) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={COLORS.brand} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xxl,
    gap: SPACING.md,
  },
  label: {
    fontSize: FONT.sm,
    color: COLORS.textMuted,
    writingDirection: 'rtl',
  },
});
